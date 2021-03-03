"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const utils_1 = require("./utils");
/**
 * @hidden
 */
class DB {
    constructor(api) {
        this.api = api;
        this.scope = {
            function: {},
            global: {},
            conversation: {}
        };
    }
    getDB(db_name) {
        return this.api.request("/v2/kv/get", {
            key: db_name
        }).then((response) => {
            return response.data;
        }).catch(() => {
            return { result: null };
        });
    }
    putDB(db_name, type) {
        var _a;
        const value = (_a = this.scope) === null || _a === void 0 ? void 0 : _a[type];
        if (!value) {
            console.log(`DB ${type} not found`);
            return;
        }
        return this.api.request("/v2/kv/put", {
            key: db_name,
            value: value,
            ttl: -1
        }).then((response) => {
            return response.data;
        }).catch(() => {
            return { result: null };
        });
    }
    getAllDB(_DBs) {
        return axios_1.default.all(_DBs).then(axios_1.default.spread((func, acc, conv) => {
            const functionDB = (typeof func !== "undefined" && (func === null || func === void 0 ? void 0 : func.result)) ? JSON.parse(func.result) : {};
            const accountDB = (typeof acc !== "undefined" && (acc === null || acc === void 0 ? void 0 : acc.result)) ? JSON.parse(acc.result) : {};
            const conversationDB = (typeof conv !== "undefined" && (conv === null || conv === void 0 ? void 0 : conv.result)) ? JSON.parse(conv.result) : {};
            this.scope = {
                function: functionDB,
                global: accountDB,
                conversation: conversationDB
            };
        })).catch((err) => {
            console.log(err);
        });
    }
    putAllDB(_DBs) {
        axios_1.default.all(_DBs).then(axios_1.default.spread((func, acc, conv) => {
            console.log("result", func, acc, conv);
        })).catch((err) => {
            console.log(err);
        });
    }
    getScopeValue(key, scope = "global") {
        var _a, _b;
        return ((_b = (_a = this.scope) === null || _a === void 0 ? void 0 : _a[scope]) === null || _b === void 0 ? void 0 : _b[key]) || null;
    }
    setScopeValue(key, value, scope = "global") {
        var _a, _b;
        if ((_b = (_a = this.scope) === null || _a === void 0 ? void 0 : _a[scope]) === null || _b === void 0 ? void 0 : _b[key]) {
            this.scope[scope][key] = value;
            return true;
        }
        return false;
    }
    getScopeAllValues(scope = "global") {
        return typeof this.scope[scope] !== "undefined" ? utils_1.default.clone(this.scope[scope]) : null;
    }
}
exports.default = DB;
