"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path = require('path');
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
    try {
        const directory = path.resolve(__dirname, '../../../../');
        const result = dotenv.config({ path: directory + '/.env' });
        if (result.error) {
            throw result.error;
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
