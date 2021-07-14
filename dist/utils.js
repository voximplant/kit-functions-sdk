"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
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
exports.default = {
    clone,
    getHeaderValue,
    getEnv,
};
