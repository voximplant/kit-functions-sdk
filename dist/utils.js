"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
/**
 * @hidden
 */
const fs = require('fs');
/**
 * @hidden
 */
const clone = (object) => {
    return JSON.parse(JSON.stringify(object));
};
/**
 * @hidden
 */
const getHeaderValue = (context, name, defaultValue) => {
    return (typeof context.request.headers[name] !== "undefined") ? context.request.headers[name] : defaultValue;
};
/**
 * @hidden
 */
const getEnv = function getEnv() {
    /* istanbul ignore next */
    try {
        const directory = '/userfunc/deployarchive/.env';
        if (fs.existsSync(directory)) {
            const result = dotenv.config({ path: directory });
            if (result.error) {
                throw result.error;
            }
        }
        else {
            console.log('The path to the .env file could not be found');
        }
    }
    catch (err) {
        console.log(err);
    }
};
/**
 * @hidden
 */
const getDfKey = function getDfKey(id) {
    /* istanbul ignore next */
    if (typeof id !== 'number') {
        console.error('The parameter key must be an integer');
        return null;
    }
    try {
        const directory = '/userfunc/deployarchive/df';
        const json = `${directory}/${id}.json`;
        if (fs.existsSync(json)) {
            const rawData = fs.readFileSync(json);
            return JSON.parse(rawData);
        }
        else {
            console.error('The df key was not found');
            return null;
        }
    }
    catch (err) {
        console.error(err);
        return null;
    }
};
/**
 * @hidden
 */
const getDfKeysList = function getDfKeysList() {
    /* istanbul ignore next */
    try {
        const directory = '/userfunc/deployarchive/df';
        return fs.readdirSync(directory);
    }
    catch (err) {
        console.error(err);
        return [];
    }
};
/**
 * @hidden
 */
const getEnvVariable = function getEnvVariable(name) {
    if (typeof name === 'string') {
        return name in process.env ? process.env[name] : null;
    }
    else {
        return null;
    }
};
/**
 * @hidden
 */
const getVersion = function getVersion() {
    const packageJson = path.resolve(__dirname, '../package.json');
    try {
        if (fs.existsSync(packageJson)) {
            const json = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
            return json.version;
        }
        else {
            return;
        }
    }
    catch (err) {
        console.log(err);
    }
};
const isObject = item => Object.getPrototypeOf(item) === Object.prototype;
/**
 * @hidden
 */
exports.default = {
    clone,
    getHeaderValue,
    getEnv,
    getEnvVariable,
    getVersion,
    getDfKey,
    getDfKeysList,
    isObject
};
