const fs = require('fs');
const process = require('process');
const chalk = require('colors');
const path = require('path');
/**
 * A file in the project root with the doc settings
 */
const configPath = path.resolve(__dirname, './config.doc.json') ;
const requiredConfigFields = ['baseFqdn', 'srcFilePath', 'buildFilePath'];
const requiredWrapperFields = ['title', 'description', 'kind'];
let config;
let docEntityNames;
/**
 * Entities that should redirect to another entity in the documentation, e.g. EventHandlers to Events
 */
let docEntityRedirects;
/**
 * Entities that have their params defined some where else, e.g. Events params are defined in EventHandlers interfaces
 */
let docEntityTypedefs;
/**
 * Entities that doesn't have a separate webpage in the documentation, but just an anchor on a parent entity page.
 */
let docAnchorEntityNames;
let flatNodes;
/**
 * Variable for logging the build result report if it's successful
 */
let statusReport = {};
let sourceDoc;
let reshapedDoc;

const EXAMPLES_DIR = path.resolve(__dirname, '../examples');

// Global variable to store all referenced types
let referencedTypes = {};

/**
 * Get doc config
 */
if (!fs.existsSync(configPath)) {
  freakOutAndExit('There\'s no \'config.doc.json\' file in the project root. Please add one to convert typedoc to voxdoc format.');
}

try {
  config = JSON.parse(fs.readFileSync(configPath));
} catch (e) {
  freakOutAndExit('Failed to parse \'config.doc.json\':', e);
}

if (requiredConfigFields.some(field => !config.hasOwnProperty(field))) {
  freakOutAndExit(`No ${requiredConfigFields.find(field => !config.hasOwnProperty(field))} in the 'config.doc.json'.`);
}

if (config.wrapper && requiredWrapperFields.some(field => !config.wrapper.hasOwnProperty(field))) {
  freakOutAndExit(`No ${requiredWrapperFields.find(field => !config.wrapper.hasOwnProperty(field))} in the 'wrapper' field in the 'config.doc.json'.`);
}

console.log(`Converting ${config.srcFilePath} to ${config.buildFilePath}...`);

/**
 * Polyfills fo node
 */
if (!Array.prototype.flat) {
  Array.prototype.flat = function () {
    return this.reduce((acc, el) => [...acc, ...(Array.isArray(el) ? el.flat() : [el])], []);
  }
}

if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function (mapper) {
    return this.map(mapper).flat();
  }
}

/**
 * Read and parse the source file with JSON (hopefully)
 */
try {
  sourceDoc = JSON.parse(fs.readFileSync(config.srcFilePath));
  console.log('Documentation file loaded. SchemaVersion:', sourceDoc.schemaVersion || 'Legacy (1.0)');
} catch (e) {
  freakOutAndExit('Failed to read or parse the source file:', e);
}

// --- Adapter for compatibility with new TypeDoc ---
if (!sourceDoc.children) {
  // Attempt to build children manually from groups and symbolIdMap (TypeDoc >=0.24)
  if (sourceDoc.groups && Array.isArray(sourceDoc.groups) && sourceDoc.symbolIdMap) {
    const idToNode = {};
    // Collect all nodes by id from symbolIdMap
    if (sourceDoc.children) {
      // Do nothing, children already exists
    } else if (sourceDoc.symbolIdMap) {
      // Extract all ids from symbolIdMap, find them in sourceDoc (if there's an array of nodes or similar)
      // But most often the necessary objects are in sourceDoc['children'] or sourceDoc['declarations']
      // In newer versions of TypeDoc everything is in sourceDoc['children'] (or in sourceDoc['declarations'])
      // But if children doesn't exist, let's try to collect from groups
      // For simplicity: find all ids from groups, find them in symbolIdMap, form fake children
      const allIds = sourceDoc.groups.flatMap(g => g.children);
      sourceDoc.children = allIds.map(id => {
        // symbolIdMap[id] is just information about qualifiedName, packagePath, etc.
        // But the node object itself must be sought in sourceDoc.declarations or sourceDoc.nodes (if available)
        // In some versions of TypeDoc there is a "nodes" or "declarations" field - look there
        let node = null;
        if (sourceDoc.declarations && Array.isArray(sourceDoc.declarations)) {
          node = sourceDoc.declarations.find(n => n.id === id);
        }
        if (!node && sourceDoc.nodes && Array.isArray(sourceDoc.nodes)) {
          node = sourceDoc.nodes.find(n => n.id === id);
        }
        // If not found, make a placeholder
        if (!node) {
          node = { id, name: symbolIdMap[id]?.qualifiedName || `unknown_${id}` };
        }
        return node;
      });
      console.log('Children field built from groups and symbolIdMap:', sourceDoc.children.length);
    }
  }
}

if (!sourceDoc.children) {
  freakOutAndExit('Could not find or build children field in json. Check the file structure.');
}

/**
 * New function for collecting all types used in the API
 * We'll look in method parameters, return values, etc.
 * for all reference types and add them to the documentation
 */
function collectAllReferencedTypes() {
  const typesToAdd = [];
  
  // Collect all types that have references
  Object.values(referencedTypes).forEach(typeInfo => {
    // Look for type description in sourceDoc or flatNodes
    let typeNode = null;
    
    // Search in the new TypeDoc format
    if (sourceDoc.declarations && Array.isArray(sourceDoc.declarations)) {
      typeNode = sourceDoc.declarations.find(n => 
        n.name === typeInfo.name || 
        (n.target && n.target.qualifiedName === typeInfo.qualifiedName)
      );
    }
    
    // Search in flatNodes
    if (!typeNode && flatNodes) {
      typeNode = flatNodes.find(n => 
        n.name === typeInfo.name || 
        (n.qualifiedName === typeInfo.qualifiedName)
      );
    }
    
    // Check if the type contains @hidden tag
    let isHidden = false;
    if (typeNode && typeNode.comment) {
      // Only new format (TypeDoc 2.0): blockTags
      if (Array.isArray(typeNode.comment.blockTags) && 
          typeNode.comment.blockTags.some(tag => tag.tag === '@hidden')) {
        isHidden = true;
      }
    }
    
    // If the type is not marked as @hidden, add it to the documentation
    if (!isHidden) {
      // If we found the type, add it to the documentation
      if (typeNode) {
        typesToAdd.push(reshapeNode(typeNode, config.baseFqdn));
      } else {
        // We didn't find the node, but let's create a maximally informative placeholder
        // Maybe the type is in the types.ts module - let's try to find it
        const typesModuleNodes = flatNodes.filter(n => 
          n.sources && n.sources.some(s => s.fileName.includes('types.ts'))
        );
        
        let typeProperties = [];
        
        // Look for an interface that corresponds to this type
        const interfaceNode = typesModuleNodes.find(n => n.name === typeInfo.name && (n.kind === 256 || n.kind === 128));
        if (interfaceNode && interfaceNode.children) {
          // If we found an interface, collect its properties
          typeProperties = interfaceNode.children.map(prop => {
            let propType = 'any';
            if (prop.type) {
              try {
                propType = getTypes(prop.type, config.baseFqdn).join(' | ');
              } catch (e) {
                propType = 'unknown';
              }
            } else if (prop.signatures && prop.signatures[0] && prop.signatures[0].type) {
              try {
                propType = getTypes(prop.signatures[0].type, config.baseFqdn).join(' | ');
              } catch (e) {
                propType = 'unknown';
              }
            }
            
            return {
              name: prop.name,
              type: propType,
              description: getDescription(prop, config.baseFqdn),
              optional: prop.flags && prop.flags.isOptional
            };
          });
        }
        
        // Create type description based on collected properties
        let typeDescription = `Referenced type: ${typeInfo.qualifiedName || typeInfo.name}`;
        if (typeProperties.length > 0) {
          typeDescription += '\n\n**Properties:**\n\n';
          typeProperties.forEach(prop => {
            typeDescription += `- \`${prop.name}${prop.optional ? '?' : ''}: ${prop.type}\` - ${prop.description || 'No description available'}\n`;
          });
        }
        
        // Add type to documentation
        typesToAdd.push({
          fqdn: `${config.baseFqdn}.${typeInfo.name.toLowerCase()}`,
          kind: 'typedef',
          title: typeInfo.name,
          description: typeDescription,
          types: [typeInfo.qualifiedName || typeInfo.name]
        });
      }
    }
  });
  
  return typesToAdd;
}

try {
  flatNodes = sourceDoc.children.reduce(flattenNodes, []);
} catch (e) {
  freakOutAndExit('Failed to flat doc nodes:', e);
}

/**
 * Get an object that maps short entity names to arrays of full entity names (there're entities with the same name in different namespaces and modules)
 * E.g. {EventHandlers: ['Voximplant.EventHandlers', 'Voximplant.Messaging.EventHandlers']}
 * It's needed to guess which entity is meant (if its name appears more than in one module) an assemble link to it (the link's format is `/docs/websdk/voximplant/${FullEntityName.toLowerCase()}`)
 */
try {
  docEntityNames = collectEntityNames(sourceDoc.children);
  // console.log('docEntityNames', docEntityNames);
} catch (e) {
  freakOutAndExit('Failed to collect entity names:', e);
}


try {
  docAnchorEntityNames = collectAnchorEntityNames(sourceDoc.children);
  // console.log('docAnchorEntityNames', docAnchorEntityNames);
} catch (e) {
  freakOutAndExit('Failed to collect anchor entity names:', e);
}

/**
 * Map entities that have a @typedef tag with entities that define their params
 */
try {
  docEntityTypedefs = collectEntityTypedefs();
  // console.log('docEntityTypedefs', docEntityTypedefs);
} catch (e) {
  freakOutAndExit('Failed to collect entity typedefs:', e);
}

/**
 * Map private entities that redirect to public ones with them
 */
try {
  docEntityRedirects = collectEntityRedirects();
  // console.log('docEntityRedirects', docEntityRedirects);
} catch (e) {
  freakOutAndExit('Failed to collect entity redirects:', e);
}

/**
 * Remove previous build file if it's out there
 */
try {
  if (fs.existsSync(config.buildFilePath)) {
    fs.unlinkSync(config.buildFilePath);
  }
} catch (e) {
  freakOutAndExit(`Failed to remove the previous doc file ${config.buildFilePath}`, e);
}

/**
 * Function for normalizing the documentation structure
 * Transforms it to a view similar to the old format
 */
function normalizeDocStructure(docTree) {
  // Collect types from the types module
  const typeNodes = [];
  
  // First pass: find the types module and collect types
  docTree.forEach(node => {
    if (node.kind === 'module' && node.title === 'types') {
      if (node.children) {
        // Extract types from the module and place them at the root
        node.children.forEach(typeNode => {
          if (['enum', 'interface', 'typedef'].includes(typeNode.kind)) {
            // Transform the path and fix the kind
            const transformedTypeNode = transformTypeNode(typeNode);
            typeNodes.push(transformedTypeNode);
          }
        });
      }
    }
  });
  
  // Second pass: process all nodes except the types module
  const transformedNodes = docTree
    .filter(node => !(node.kind === 'module' && node.title === 'types'))
    .map(node => {
      // Special handling for the index module - transform it to VoximplantKit
      if (node.kind === 'module' && node.title === 'index') {
        // Change the module name to VoximplantKit
        node = {
          ...node,
          title: 'VoximplantKit',
          fqdn: 'references.kit_functions.voximplantkit'
        };
        
        // If it has children, correct their paths
        if (node.children) {
          node.children = node.children.map(child => {
            // If this is an export= class, process it and its children
            if (child.kind === 'class' && child.title === 'export=') {
              // Process the children of the export= class
              if (child.children) {
                child.children = child.children.map(method => {
                  return {
                    ...method,
                    // Fix the link by removing .export=.
                    fqdn: method.fqdn.replace('references.kit_functions.index.export=', 'references.kit_functions.voximplantkit'),
                    // Fix params paths if they exist
                    ...(method.params ? {
                      params: method.params.map(param => ({
                        ...param,
                        fqdn: param.fqdn.replace('references.kit_functions.index.export=', 'references.kit_functions.voximplantkit')
                      }))
                    } : {})
                  };
                });
              }
              
              // Update fqdn for the class itself
              return {
                ...child,
                fqdn: 'references.kit_functions.voximplantkit',
                title: 'VoximplantKit' // Change the class name to VoximplantKit
              };
            }
            
            // For other children just update fqdn
            return {
              ...child,
              fqdn: child.fqdn.replace('references.kit_functions.index', 'references.kit_functions.voximplantkit')
            };
          });
        }
      }
      
      // Process modules and transform them into corresponding classes
      if (node.kind === 'module') {
        // If there are 'default' or 'export=' classes inside the module
        const defaultClass = node.children && node.children.find(child => 
          child.kind === 'class' && (child.title === 'default' || child.title === 'export='));
          
        if (defaultClass) {
          // Merge class and module
          return {
            ...node,
            kind: 'class', // Transform module to class
            children: defaultClass.children.map(method => {
              // Fix paths in fqdn (remove .default or .export=)
              return {
                ...method,
                fqdn: method.fqdn.replace(`${node.fqdn}.default.`, `${node.fqdn}.`)
                               .replace(`${node.fqdn}.export=.`, `${node.fqdn}.`),
                // Fix paths in params, if they exist
                ...(method.params ? {
                  params: method.params.map(param => ({
                    ...param,
                    fqdn: param.fqdn.replace(`${node.fqdn}.default.`, `${node.fqdn}.`)
                                    .replace(`${node.fqdn}.export=.`, `${node.fqdn}.`)
                  }))
                } : {})
              };
            })
          };
        }
        
        // If there's no default class, but there are other classes
        const otherClasses = node.children && node.children.filter(child => child.kind === 'class');
        if (otherClasses && otherClasses.length > 0) {
          // Transform the module into a class with children of other classes
          return {
            ...node,
            kind: 'class',
            children: otherClasses.flatMap(cls => cls.children || []).map(method => {
              // Fix paths in fqdn
              const className = otherClasses[0].title;
              return {
                ...method,
                fqdn: method.fqdn.replace(`${node.fqdn}.${className}.`, `${node.fqdn}.`),
                // Fix paths in params, if they exist
                ...(method.params ? {
                  params: method.params.map(param => ({
                    ...param,
                    fqdn: param.fqdn.replace(`${node.fqdn}.${className}.`, `${node.fqdn}.`)
                  }))
                } : {})
              };
            })
          };
        }
        
        // If the module doesn't contain classes, just transform it to a class
        return {
          ...node,
          kind: 'class',
        };
      }
      
      // If the node has children, recursively process them
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: normalizeDocStructure(node.children)
        };
      }
      
      return node;
    });
  
  // Add special handling for WebChatInlineButtonType - always make it an enum
  const finalNodes = [...transformedNodes, ...typeNodes];
  
  for (let i = 0; i < finalNodes.length; i++) {
    if (finalNodes[i].title === 'WebChatInlineButtonType') {
      finalNodes[i] = {
        fqdn: 'references.kit_functions.webchatinlinebuttontype',
        kind: 'enum',
        title: 'WebChatInlineButtonType',
        description: '',
        children: [
          {
            fqdn: 'references.kit_functions.webchatinlinebuttontype.text',
            kind: 'constants',
            title: 'Text',
            description: ''
          }
        ]
      };
    }
  }
  
  return finalNodes;
}

/**
 * Function for transforming a type node
 * Adjusts the node format according to the desired structure
 */
function transformTypeNode(node) {
  const newFqdn = `references.kit_functions.${node.title.toLowerCase()}`;
  let transformedNode = {
    ...node,
    fqdn: newFqdn
  };
  
  // If the node has children, recursively transform them too
  if (transformedNode.children) {
    transformedNode.children = transformedNode.children.map(child => {
      return {
        ...child,
        fqdn: child.fqdn.replace(/^references\.kit_functions\.types\./, 'references.kit_functions.')
      };
    });
  }
  
  return transformedNode;
}

/**
 * Fix type links in documentation
 */
function fixTypeLinks(docTree) {
  const processString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Заменяем ссылки вида "/kit/docs/references/kit_functions/types/xxx"
    if (str.includes('/kit/docs/references/kit_functions/types/')) {
      // Для простых ссылок
      str = str.replace('/kit/docs/references/kit_functions/types/', '/kit/docs/references/kit_functions/');
    }
    
    // Заменяем ссылки внутри строки, используя регулярное выражение для поиска всех Markdown ссылок
    return str.replace(/\[([^\]]+)\]\(\/kit\/docs\/references\/kit_functions\/types\/([^)]+)\)/g, 
      '[$1](/kit/docs/references/kit_functions/$2)');
  };
  
  // Рекурсивно обрабатываем объект документации
  const processObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Обрабатываем массивы
    if (Array.isArray(obj)) {
      return obj.map(item => processObject(item));
    }
    
    // Создаем новый объект с обработанными свойствами
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Обрабатываем строковые значения
        result[key] = processString(value);
      } else if (Array.isArray(value)) {
        // Обрабатываем массивы (например, types, returns, и т.д.)
        result[key] = value.map(item => 
          typeof item === 'string' ? processString(item) : processObject(item)
        );
      } else if (value && typeof value === 'object') {
        // Рекурсивно обрабатываем вложенные объекты
        result[key] = processObject(value);
      } else {
        // Примитивные значения оставляем без изменений
        result[key] = value;
      }
    }
    
    return result;
  };
  
  // Обрабатываем все дерево документации
  return processObject(docTree);
}

/**
 * Применяем нормализацию к документации перед сохранением
 */
try {
  // Собираем все использованные типы в документацию
  const additionalTypes = collectAllReferencedTypes();
  
  // Добавляем типы к основной документации
  let rawDoc = config.wrapper
    ? [{
      ...config.wrapper,
      fqdn: config.baseFqdn,
      children: reshapeNodes(sourceDoc.children, config.baseFqdn).concat(additionalTypes)
    }]
    : reshapeNodes(sourceDoc.children, config.baseFqdn).concat(additionalTypes);
    
  // Нормализуем структуру документации
  reshapedDoc = normalizeDocStructure(rawDoc);
  
  // Исправляем ссылки на типы
  reshapedDoc = fixTypeLinks(reshapedDoc);
  
} catch (e) {
  freakOutAndExit('Failed to reshape the source json:', e);
}

/**
 * Write new JSON in a file
 */
try {
  fs.writeFileSync(config.buildFilePath, JSON.stringify(reshapedDoc));
} catch (e) {
  freakOutAndExit(`Failed to write the JSON to the file ${config.buildFilePath}`, e);
}

/**
 * Report
 */
console.log(chalk.cyan('\nDOC BUILD SUMMARY:'));
Object.entries(statusReport)
  .sort(([e1], [e2]) => e1 > e2 ? 1 : -1)
  .forEach(([entity, num]) => console.log(`${chalk.magenta(entity.toUpperCase())}:`, chalk.cyan(num), 'entities'));
console.log(chalk.cyan('\nDOC TREE: the tree is hidden'));
//console.log(chalk.blue(reshapedDoc.reduce((tree, node) => getNodeNamesTree(tree, node), '')));


//==================================================================================================
//========================================== SHAPERS ===============================================
//==================================================================================================


/**
 * Restructure a 'children' array from the source JSON
 */
function reshapeNodes(nodes, fqdn) {
  const sortPriority = ['ref_folder', 'module', 'class', 'constructor', 'interface', 'function', 'method', 'prop', 'getter', 'setter', 'event', 'enum', 'constants', 'const', 'typedef'];

  return nodes
    .filter(isValidNode)
    .map(node => reshapeNode(node, fqdn))
    .filter(Boolean) // Отфильтровываем null (элементы с @hidden)
    .sort((n1, n2) => sortPriority.indexOf(n1.kind) > sortPriority.indexOf(n2.kind)
      ? 1
      : sortPriority.indexOf(n1.kind) < sortPriority.indexOf(n2.kind)
        ? -1
        : n1.title > n2.title
          ? 1
          : -1);
}

/**
 * Restructure an entry in a 'children' array from the source JSON
 */
function reshapeNode(node, parentFqdn) {
  // Если нода помечена тегом @hidden, не включаем её в документацию
  if (!isValidNode(node)) {
    return null;
  }

  const fqdn = `${parentFqdn}.${node.name.toLowerCase()}`;
  const nodeKinds = {
    0: 'module',
    1: 'module',
    2: 'module',
    4: 'enum',
    8: 'enum', // Новый тип для WebChatInlineButtonType
    16: 'constants',
    32: 'const',
    64: 'function',
    128: 'class',
    256: 'interface',
    512: 'constructor',
    1024: 'prop',
    2048: 'method',
    262144: 'prop',
    2097152: 'enum', // Новый тип для ChannelType
    8388608: 'events',
    4194304: 'typedef',
  };
  
  // Специальная обработка для DataBaseType - всегда устанавливаем его как typedef
  if (node.name === 'DataBaseType') {
    return {
      fqdn,
      kind: 'typedef',
      title: node.name,
      description: getDescription(node, fqdn) || 'Database scope type',
      types: ['string'],
      ...(node.type ? {types: getTypes(node.type, fqdn)} : {})
    };
  }
  
  // Обработка union типов - все они должны быть typedef, а не enum
  if (node.type && node.type.type === 'union') {
    return {
      fqdn,
      kind: 'typedef',
      title: node.name,
      description: getDescription(node, fqdn) || '',
      types: getTypes(node.type, fqdn)
    };
  }
  
  // Обработка параметров метода и сохранение типов
  const methodParams = (node.kind === 64 || node.kind === 2048 || node.kind === 512) && node.signatures && node.signatures
    .filter(s => s.parameters)
    .flatMap(s => s.parameters.map(p => {
      // Собираем информацию о типе параметра
      if (p.type && p.type.type === 'reference' && p.type.target && p.type.target.qualifiedName) {
        const typeName = p.type.name;
        const qualifiedName = p.type.target.qualifiedName;
        
        // Сохраняем информацию о типе для последующего добавления
        if (!referencedTypes[qualifiedName]) {
          referencedTypes[qualifiedName] = { 
            name: typeName, 
            qualifiedName, 
            packageName: p.type.target.packageName || '',
            packagePath: p.type.target.packagePath || ''
          };
        }
      }
      
      return {
        fqdn: `${fqdn}.${p.name.toLowerCase()}`,
        title: p.name,
        description: getDescription(p, fqdn),
        optional: Boolean(p.flags && p.flags.isOptional),
        types: getTypes(p.type, fqdn, true).filter(t => !p.flags.isOptional || t !== 'undefined'),
        ...(p.defaultValue
          ? {defaultValue: p.defaultValue}
          : {})
      };
    }));
    
  const isStatic = node?.flags?.isStatic;
  const eventParams = node.kind === 16 && docEntityTypedefs[node.defaultValue || node.name] && reshapeNodes(docEntityTypedefs[node.defaultValue || node.name], fqdn);
  const attributes = (node.kind === 2048 || node.kind === 64) && node.signatures && node.signatures.some(s => s.comment && s.comment.tags)
    ? getAttributes(node.signatures.filter(s => s.comment && s.comment.tags).flatMap(s => s.comment.tags)) || {}
    : node.comment && node.comment.tags && getAttributes(node.comment.tags) || {};

  let children = node.children && reshapeNodes(node.children, fqdn);
  /**
   * Add class members' typedefs to its children array
   */
  if (node.kind === 128 && docEntityTypedefs[node.defaultValue || node.name] && docEntityTypedefs[node.defaultValue || node.name].length) {
    children = (children || []).concat(reshapeNodes(docEntityTypedefs[node.defaultValue || node.name], fqdn));
  }

  if (!nodeKinds[node.kind]) {
    freakOutAndExit(`Unknown entity kind ${node.kindString} (id ${node.kind}) for entity ${node.name} from ${node.sources[0].fileName}:${node.sources[0].line}:${node.sources[0].character}`);
  }

  statusReport[node.kind === 512 ? 'constructors' : nodeKinds[node.kind]] = (statusReport[node.kind === 512 ? 'constructors' : nodeKinds[node.kind]] || 0) + 1;

  // Получаем пример: сначала по @exampleFile/@example, если есть, иначе по fqdn
  let example = null;
  const exampleFile = extractExampleFileTag(node);
  if (exampleFile) {
    const examplePath = path.join(EXAMPLES_DIR, exampleFile);
    if (fs.existsSync(examplePath)) {
      example = fs.readFileSync(examplePath, 'utf-8');
    }
  }
  // Если не нашли по тегу — ищем по fqdn
  if (!example) {
    example = getExampleForEntity(fqdn);
  }

  // Формируем description: если есть example, добавляем его с новой строки
  let description = node.comment || node.signatures ? getDescription(node, fqdn) : '';
  if (example) {
    if (description) {
      description += '\n\n' + example.trim();
    } else {
      description = example.trim();
    }
  }
  
  // Обработка и сохранение информации о типах возвращаемых значений
  if ((node.kind === 64 || node.kind === 2048) && node.signatures) {
    node.signatures.forEach(signature => {
      if (signature.type && signature.type.type === 'reference' && signature.type.target && signature.type.target.qualifiedName) {
        const typeName = signature.type.name;
        const qualifiedName = signature.type.target.qualifiedName;
        
        // Сохраняем информацию о типе для последующего добавления
        if (!referencedTypes[qualifiedName]) {
          referencedTypes[qualifiedName] = { 
            name: typeName, 
            qualifiedName, 
            packageName: signature.type.target.packageName || '',
            packagePath: signature.type.target.packagePath || ''
          };
        }
      }
    });
  }

  return {
    fqdn,
    kind: nodeKinds[node.kind],
    title: node.name,
    description,
   /* ...(example ? {example} : {}),*/
    ...(attributes && Object.keys(attributes).length
      ? {attributes}
      : {}),
    ...(node.type || node.getSignature
      ? {types: getTypes(node.type || node.getSignature.type ||node.getSignature[0].type, fqdn, false, node)}
      : {}),
    ...(children && children.length
      ? {children}
      : {}),
    ...((node.kind === 64 || node.kind === 2048) && node.signatures && node.signatures.some(s => s.type)
      ? {returns: node.signatures.filter(s => s.type).flatMap(s => getTypes(s.type, fqdn))}
      : {}),
    ...(methodParams && methodParams.length || eventParams && eventParams.length
      ? {params: methodParams || eventParams}
      : {}),
    ...isStatic ? {modifiers: {static: true}} : {},
    ...((node.kind === 1024 || node.kind === 262144) && node.flags && node.flags.isOptional
      ? {optional: node.flags.isOptional}
      : {})
  }
}

/**
 * Filter out unnecessary nodes
 */
function isValidNode(node) {
  let isValid = true;

  if (config.include) {
    isValid = node.flags && config.include.every(flag => node.flags[flag]);
  }

  if (config.exclude) {
    isValid = !node.flags || config.exclude.every(flag => !node.flags[flag]);
  }

  if (node.sources && node.sources.some(source => source.fileName.includes('node_modules'))) {
    isValid = false;
  }
  
  // Проверяем наличие тега @hidden в комментариях
  if (isValid && node.comment) {
    // Проверяем только через blockTags (новый формат)
    if (Array.isArray(node.comment.blockTags) && 
        node.comment.blockTags.some(tag => tag.tag === '@hidden')) {
      isValid = false;
    }
    
    // Проверяем текст комментария на наличие "@hidden"
    if (node.comment.text && node.comment.text.includes('@hidden')) {
      isValid = false;
    }
  }
  
  // Проверяем наличие тега @hidden в сигнатурах
  if (isValid && node.signatures && node.signatures.length > 0) {
    for (const sig of node.signatures) {
      if (sig.comment) {
        // Проверяем через blockTags
        if (Array.isArray(sig.comment.blockTags) && 
            sig.comment.blockTags.some(tag => tag.tag === '@hidden')) {
          isValid = false;
          break;
        }
        
        // Проверка текста комментария
        if (sig.comment.text && sig.comment.text.includes('@hidden')) {
          isValid = false;
          break;
        }
      }
    }
  }

  // Для модулей дополнительно проверяем имя файла
  if (isValid && node.kind && (node.kind === 0 || node.kind === 1 || node.kind === 2) && node.sources && node.sources.length > 0) {
    // Имена модулей, которые должны быть скрыты
    const hiddenModules = ['api', 'db', 'message', 'utils'];
    
    // Проверка по базовому имени файла (без расширения)
    const fileName = node.sources[0].fileName;
    const baseName = fileName.split('/').pop().split('\\').pop().split('.')[0].toLowerCase();
    
    if (hiddenModules.includes(baseName)) {
      isValid = false;
    }
    
    // Дополнительная проверка по имени модуля
    if (node.name && hiddenModules.includes(node.name.toLowerCase())) {
      isValid = false;
    }
  }
  
  return isValid;
}

/**
 * Get entity description
 */
function getDescription({comment, signatures} = {}, fqdn) {
  let descr = '';

  // Только новый формат: comment.summary[]
  if (comment) {
    if (Array.isArray(comment.summary)) {
      descr = comment.summary.map(s => s.text).join('');
    }
  }

  // Methods, Functions
  if (signatures) {
    descr = signatures
      .map(s => s.comment ? (Array.isArray(s.comment.summary) ? s.comment.summary.map(ss => ss.text).join('') : '') : '')
      .join('\n');
  }

  return descr ? addLinksToDescription(descr, fqdn).trim() : '';
}

/**
 * Add links to the Doc entities in .md format if there's none
 */
function addLinksToDescription(descr, fqdn) {
  return descr.replace(/\[([A-Za-z\.]+?)\]([^\(]|$)/g, (match, entity, nextChar) => {
    if (docEntityRedirects[entity]) {
      console.log(`description replacement: ${entity} to ${docEntityRedirects[entity].slice(1, -1)} at ${fqdn}`);
      entity = docEntityRedirects[entity].slice(1, -1);
    }
    /**
     * Check if an entity exists in the precise module
     */
    if (entity.includes('.') && !Object.values(docEntityNames).flat().some(fullName => fullName.includes(entity))) {
      console.warn(`No entity ${entity} mentioned in description at ${fqdn}`);

      return match;
    }

    const linkToEntity = getLinkToDocEntity(entity, fqdn);

    if (!linkToEntity) {
      console.warn('No link to entity: ', entity, 'from', fqdn);
    }

    return `${linkToEntity}${nextChar}` || match;
  });
}

/**
 * Get entity attributes from source JSON tags
 */
function getAttributes(tags) {
  const attributes = ['deprecated', 'since', 'beta', 'hidden', 'see'];
  const platforms = ['chrome', 'firefox', 'edge', 'safari', 'safari_ios', 'chrome_android', 'ios', 'android'];
  const isMobile = (tag) => tag === 'ios' || tag === 'android';

  // Обрабатываем только теги в новом формате (blockTags)
  if (Array.isArray(tags) && tags.length > 0 && typeof tags[0].tag === 'string' && tags[0].tag.startsWith('@')) {
    return tags.reduce((tagsObj, blockTag) => {
      const tag = blockTag.tag.substring(1); // Убираем @ в начале
      const text = Array.isArray(blockTag.content) 
        ? blockTag.content.map(c => c.text).join('') 
        : '';
        
      return attributes.includes(tag)
        ? {...tagsObj, [tag]: addLinksToDescription(text.trim()) || null}
        : platforms.includes(tag)
          ? {
            ...tagsObj,
            platform: {...(tagsObj.platform || {}), [tag]: text.trim(), kind: isMobile(tag) ? 'mobile' : 'web'}
          }
          : tagsObj;
    }, {});
  }
  
  return {};
}

/**
 * Get entity types
 */
function getTypes(type, fqdn, isFuncParam = false) {
  /**
   * Exclude generic constant names and usages
   */
  if (type.type === 'typeParameter') {
    return [];
  }

  /**
   * JS types
   */
  if (type.type === 'intrinsic' || type.type === 'unknown') {
    return [type.name];
  }

  /**
   * String values
   */
  if (type.type === 'stringLiteral') {
    return [type.value];
  }

  /**
   * Union types
   */
  if (type.type === 'union' && type.types) {
    return type.types.flatMap(arg => getTypes(arg, fqdn, isFuncParam));
  }

  /**
   * Intersection types
   */
  if (type.type === 'intersection' && type.types) {
    return [type.types.flatMap(arg => getTypes(arg, fqdn, isFuncParam)).join(' & ')];
  }

  /**
   * Arrays which are stated in a form of 'smth[]'
   */
  if (type.type === 'array' && type.elementType) {
    return [`${getTypes(type.elementType, fqdn, isFuncParam).join(' | ')}[]`];
  }

  /**
   * Doc entity types, Promises, Maps, Sets, Object declared as constructors and Arrays which are stated in a form of 'Array<smth>'
   */
  if (type.type === 'reference') {
    /**
     * Новый формат: type.target.qualifiedName
     */
    if (type.target && type.target.qualifiedName) {
      // Сохраняем информацию о типе для последующего добавления в документацию
      const typeName = type.name;
      const qualifiedName = type.target.qualifiedName;
      
      // Сохраняем информацию о типе, если его еще нет в нашем списке
      if (!referencedTypes[qualifiedName]) {
        referencedTypes[qualifiedName] = { 
          name: typeName, 
          qualifiedName, 
          packageName: type.target.packageName || '',
          packagePath: type.target.packagePath || ''
        };
      }
      
      /**
       * Пытаемся найти ссылку по qualifiedName
       */
      const link = getLinkToDocEntity(type.target.qualifiedName, fqdn);
      if (link) return [link];
      /**
       * Если не нашли ссылку, возвращаем просто имя типа
       */
      return [type.target.qualifiedName];
    }
    /**
     * Старый формат
     */
    if (type.name === 'Object') {
      return ['Object'];
    }
    if (['Array', 'Set', 'Promise'].includes(type.name) && type.typeArguments) {
      return type.name === 'Array'
        ? [`${type.typeArguments.map(arg => getTypes(arg, fqdn, isFuncParam)).join(' | ')}[]`]
        : [`${type.name}<${type.typeArguments.map(arg => getTypes(arg, fqdn, isFuncParam)).join(' | ')}>`]
    }
    if (type.name === 'Map' && type.typeArguments) {
      return [`Map<${type.typeArguments.map(arg => getTypes(arg, fqdn, isFuncParam)).join(', ')}>`];
    }
    const entityType = docEntityRedirects[type.name]
      ? parseAndGetType(docEntityRedirects[type.name], fqdn)
      : getLinkToDocEntity(type.name, fqdn);
    if (entityType) {
      return [entityType];
    }
  }

  /**
   * Objects of precise shape or Functions
   */
  if (type.type === 'reflection' && type.declaration) {
    /**
     * Objects of precise shape
     */
    if (type.declaration.indexSignature || type.declaration.children) {
      /**
       * Get a string with the ts declaration describing the shape of an object
       */
      const getShape = ({parameters, type: indexSignatureType}) => parameters
        .map(prop => `[${prop.name}: ${getTypes(prop.type, fqdn, isFuncParam)}]: ${getTypes(indexSignatureType, fqdn, isFuncParam).join(' | ')}`);
      /**
       * Object props signatures
       */
      let signatures = [];

      if (type.declaration.indexSignature) {
        signatures = Array.isArray(type.declaration.indexSignature)
          ? type.declaration.indexSignature.map(getShape)
          : getShape(type.declaration.indexSignature);
      }

      if (type.declaration.children) {
        signatures = signatures.concat(type.declaration.children.map(c => `${c.name}: ${getTypes(c.type, fqdn, isFuncParam).join(' | ')}`));
      }

      return [`{${signatures.join(', ')}}`];
    }

    /**
     * Functions
     */
    if (type.declaration.signatures) {
      if (isFuncParam) {
        return ['Function'];
      }

      /**
       * Function params definition if one
       */
      return type.declaration.signatures
        .map(({parameters, type: sType}) => {
          /**
           * Function params definition if one
           */
          const params = parameters
            ? parameters.map(p => `${p.name}: ${getTypes(p.type, fqdn, true)}`).join(', ')
            : '';

          return `(${params}) => ${getTypes(sType, fqdn, isFuncParam)}`;
        });
    }
  }

  /**
   * Для reference с target.qualifiedName не выводим лишний warning
   */
  if (type.type === 'reference' && type.target && type.target.qualifiedName) {
    return [type.target.qualifiedName];
  }

  /**
   * Normally only browser objects should be left. So check the output.
   */
  // console.warn('Unaddressed doc type: ', type); // убираем лишний warning
  return [type.name || type.value];
}

/**
 * Get type declared in doc comments
 */
function parseAndGetType(type, fqdn) {
  if (/\[.+?\]/.test(type)) {
    return type.replace(/\[(.+?)\]/g, (match, entity) => getLinkToDocEntity(entity, fqdn))
  } else {
    return type;
  }
}

/**
 * Get link to entity in .md format
 */
function getLinkToDocEntity(entityName, fqdn) {
  let shortEntityName = entityName.includes('.')
    ? entityName.split('.').slice(-1)[0]
    : entityName;

  /**
   * For entities which names collide with JS Object properties
   */
  if (typeof docEntityNames[shortEntityName] === 'function') {
    shortEntityName = `_${shortEntityName}`;
  }

  /**
   * An array as the same short name may appear in different modules
   */
  const fullyNamedEntities = docEntityNames[shortEntityName];

  if (fullyNamedEntities) {
    let fullyNamedEntity = fullyNamedEntities.length === 1
      ? fullyNamedEntities[0]
      : getClosestEntity(entityName, fqdn, fullyNamedEntities);

    fullyNamedEntity = fullyNamedEntity.replace(/\s/g, '_');

    let link = `[${entityName}](/kit/docs/${config.baseFqdn.split('.').slice(0, -1).join('/')}/${fullyNamedEntity.toLowerCase().replace(/\./g, '/').replace(/\\s/g, '_')})`;
    /**
     * Links to properties, methods and enum members contain a '.'.
     * As this entities don't have a separate web page, we replace the last '/' with an anchor on the parent entity page.
     */
    if (entityName.includes('.') || docAnchorEntityNames.includes(entityName)) {
      link = link.replace(/\/([\w]+\))$/, (match, anchor) => `#${anchor}`);
    }

    return link;
  }

  return '';
}

/**
 * Decide which entity with a duplicated name is supposed to be referred from a given fqdn
 */
function getClosestEntity(entity, fqdn, entities) {

  const entityFoundByFullName = entity.includes('.') && entities.find(e => e.includes(entity));

  if (entityFoundByFullName) {
    return entityFoundByFullName;
  }

  const fqdnParts = fqdn.split('.');
  const fqdnPartsLen = fqdnParts.length;
  return entities
    .map(e => e.toLowerCase().split('.'))
    .reduce((closest, next) => {
      const closestOverlap = closest.filter(e => fqdnParts.includes(e));
      const nextOverlap = next.filter(e => fqdnParts.includes(e));

      return closestOverlap.length > nextOverlap.length || (closestOverlap.length == nextOverlap.length && closest.length - fqdnPartsLen <= next.length - fqdnPartsLen)
        ? closest
        : next;
    })
    .join('.');
}


//==================================================================================================
//========================================== HELPERS ===============================================
//==================================================================================================


function flattenNodes(acc, node) {
  return node.children
    ? [...acc, node, ...node.children.reduce(flattenNodes, [])]
    : [...acc, node];
}

function collectEntityNames(nodes) {
  const collectEntityNamesRecursively = (entities, entity, parentName) => {
    if (!isValidNode(entity)) {
      return entities;
    }

    const fullEntityName = `${parentName}.${entity.name}`;
    const entitiesWithChildren = [
      ...entities,
      ...(entity.children
        ? entity.children.reduce((entities, entry) => collectEntityNamesRecursively(entities, entry, fullEntityName), [])
        : [])
    ];

    return entity.name
      ? [...entitiesWithChildren, fullEntityName]
      : entitiesWithChildren;
  };
  const topName = config.wrapper && config.wrapper.title || config.baseFqdn.split('.').slice(-1)[0];
  const fullyNamedEntities = nodes.reduce((entities, entity) => collectEntityNamesRecursively(entities, entity, topName), []);

  return fullyNamedEntities.reduce((entities, entity) => {
    let shortName = entity.split('.').slice(-1)[0];

    /**
     * For entities which names collide with JS Object methods
     */
    if (typeof entities[shortName] === 'function') {
      shortName = `_${shortName}`;
    }

    return {
      ...entities,
      [shortName]: [...(entities[shortName] || []), entity]
    }
  }, {});
}

function collectAnchorEntityNames() {
  return flatNodes
    .filter(n => [32].includes(n.kind))
    .map(n => n.name);
}

function collectEntityRedirects() {
  return flatNodes.reduce((refs, node) => {
    const typedef = node.comment && node.comment.tags && node.comment.tags.find(t => t.tag === 'typedef');

    if (typedef) {
      const defEntity = typedef.text.trim().split('.').slice(-1)[0];
      const nodeParent = flatNodes.find(n => n.groups && n.groups.some(g => g.children.includes(node.id)));

      return {
        ...refs,
        [defEntity]: `[${nodeParent ? nodeParent.name + '.' : ''}${node.name}]`
      }
    }

    return refs;
  }, {});
}

function collectEntityTypedefs() {
  return flatNodes.reduce((refs, node) => {
    const typedef = node.comment && node.comment.tags && node.comment.tags.find(t => t.tag === 'typedef');

    if (typedef) {
      const defEntity = typedef.text.trim().split('.').slice(-1)[0];

      return {
        ...refs,
        [node.defaultValue || node.name]: (flatNodes.find(n => n.name === defEntity && n.children) || {children: []}).children
      }
    }

    return refs;
  }, {});
}

/**
 * For report at the end of the build
 */
function getNodeNamesTree(tree, node, shift = 0) {
  const shiftStr = Array(shift * 2).fill(' ').join('');
  const branches = node.children
    ? node.children.reduce((childTree, childNode) => getNodeNamesTree(childTree, childNode, shift + 1), '')
    : '';

  return `${tree}\n${shiftStr}${node.children ? '+' : '-'} ${node.title}${branches}`;
}

function freakOutAndExit(...args) {
  console.error(...args);
  process.exit(1);
}

function getExampleForEntity(fqdn) {
  // fqdn типа references.kit_functions.voximplantkit.addtags
  const examplePath = path.join(EXAMPLES_DIR, `${fqdn}.md`);

  if (fs.existsSync(examplePath)) {
    return fs.readFileSync(examplePath, 'utf-8');
  }
  return null;
}

function extractExampleFileTag(node) {
  // 1. В comment самого node
  if (node.comment) {
    // Только новый формат: blockTags
    if (Array.isArray(node.comment.blockTags)) {
      const tag = node.comment.blockTags.find(t => t.tag.toLowerCase() === '@examplefile');
      if (tag && Array.isArray(tag.content) && tag.content.length > 0) {
        // Собираем текст из всех content
        return tag.content.map(c => c.text).join('').trim();
      }
    }
  }
  
  // 2. В comment первой сигнатуры (если есть)
  if (node.signatures && node.signatures.length > 0) {
    const sigComment = node.signatures[0].comment;
    if (sigComment) {
      // Только новый формат: blockTags
      if (Array.isArray(sigComment.blockTags)) {
        const tag = sigComment.blockTags.find(t => t.tag.toLowerCase() === '@examplefile');
        if (tag && Array.isArray(tag.content) && tag.content.length > 0) {
          return tag.content.map(c => c.text).join('').trim();
        }
      }
    }
  }
  
  return null;
}
