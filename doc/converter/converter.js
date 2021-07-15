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

/**
 * Get doc config
 */
if (!fs.existsSync(configPath)) {
  console.log(configPath)
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
} catch (e) {
  freakOutAndExit('Failed to read or parse the source file:', e);
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
 * Restructure source JSON
 */
try {
  reshapedDoc = config.wrapper
    ? [{
      ...config.wrapper,
      fqdn: config.baseFqdn,
      children: reshapeNodes(sourceDoc.children, config.baseFqdn)
    }]
    : reshapeNodes(sourceDoc.children, config.baseFqdn);
} catch (e) {
  freakOutAndExit('Failed to reshape the source json:', e);
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
  const fqdn = `${parentFqdn}.${node.name.toLowerCase()}`;
  const nodeKinds = {
    0: 'module',
    1: 'module',
    2: 'module',
    4: 'enum',
    16: 'constants',
    32: 'const',
    64: 'function',
    128: 'class',
    256: 'interface',
    512: 'constructor',
    1024: 'prop',
    2048: 'method',
    262144: 'prop',
    8388608: 'events',
    4194304: 'typedef',
  };
  const methodParams = (node.kind === 64 || node.kind === 2048 || node.kind === 512) && node.signatures && node.signatures
    .filter(s => s.parameters)
    .flatMap(s => s.parameters.map(p => ({
        fqdn: `${fqdn}.${p.name.toLowerCase()}`,
        title: p.name,
        description: getDescription(p, fqdn),
        optional: Boolean(p.flags && p.flags.isOptional),
        types: getTypes(p.type, fqdn, true).filter(t => !p.flags.isOptional || t !== 'undefined'),
        ...(p.defaultValue
          ? {defaultValue: p.defaultValue}
          : {})
      })
    ));
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

  return {
    fqdn,
    kind: nodeKinds[node.kind],
    title: node.name,
    description: node.comment || node.signatures ? getDescription(node, fqdn) : '',
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

  return isValid;
}

/**
 * Get entity description
 */
function getDescription({comment, signatures} = {}, fqdn) {
  let descr = '';

  /**
   * Properties, Enums, Classes, Interfaces, Modules
   */
  if (comment) {
    descr = `${comment.shortText || ''}${comment.shortText && comment.text ? '\n' + comment.text : (comment.text || '')}`
  }

  /**
   * Methods, Functions
   */
  if (signatures) {
    descr = signatures
      .map(s => s.comment ? `${s.comment.shortText || ''}${s.comment.text || ''}` : '')
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

  return tags.reduce((tags, {tag, text}) => attributes.includes(tag)
    ? {...tags, [tag]: addLinksToDescription(text.trim()) || null}
    : platforms.includes(tag)
      ? {
        ...tags,
        platform: {...(tags.platform || {}), [tag]: text.trim(), kind: isMobile(tag) ? 'mobile' : 'web'}
      }
      : tags, {});
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
     * Object declared as constructors
     */
    if (type.name === 'Object') {
      return ['Object'];
    }

    /**
     * Arrays, Promises, Sets
     */
    if (['Array', 'Set', 'Promise'].includes(type.name) && type.typeArguments) {
      return type.name === 'Array'
        ? [`${type.typeArguments.map(arg => getTypes(arg, fqdn, isFuncParam)).join(' | ')}[]`]
        : [`${type.name}<${type.typeArguments.map(arg => getTypes(arg, fqdn, isFuncParam)).join(' | ')}>`]
    }

    /**
     * Maps
     */
    if (type.name === 'Map' && type.typeArguments) {
      return [`Map<${type.typeArguments.map(arg => getTypes(arg, fqdn, isFuncParam)).join(', ')}>`];
    }

    /**
     * Doc entity types
     */
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
   * Normally only browser objects should be left. So check the output.
   */
  console.warn('Unaddressed doc type: ', type);
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
