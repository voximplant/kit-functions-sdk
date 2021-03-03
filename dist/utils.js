"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = {
    clone,
    getHeaderValue
};
