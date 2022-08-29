"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path = require("path");
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
/**
 * @hidden
 */
exports.default = {
    clone,
    getHeaderValue,
    getEnv,
    getEnvVariable,
    getVersion
};
