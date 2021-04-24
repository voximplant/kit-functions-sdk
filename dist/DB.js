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
        }).catch((err) => {
            console.log(err);
            return { result: null };
        });
    }
    getAllDB(names = []) {
        const _DBs = [];
        names.forEach((name) => _DBs.push(this.getDB(name)));
        //axios.spread((func: DbResponse, acc: DbResponse, conv?: DbResponse)
      return axios_1.default.all(_DBs).then(([func, acc, conv]) => {
            const functionDB = (typeof func !== "undefined" && (func === null || func === void 0 ? void 0 : func.result) && typeof func.result === 'string') ? JSON.parse(func.result) : {};
            const accountDB = (typeof acc !== "undefined" && (acc === null || acc === void 0 ? void 0 : acc.result) && typeof acc.result === 'string') ? JSON.parse(acc.result) : {};
            const conversationDB = (typeof conv !== "undefined" && (conv === null || conv === void 0 ? void 0 : conv.result) && typeof conv.result === 'string') ? JSON.parse(conv.result) : {};
            this.scope = {
                function: functionDB,
                global: accountDB,
                conversation: conversationDB
            };
        }).catch((err) => {
            console.log(err);
        });
    }
    putDB(db_name, type) {
        var _a;
        const value = (_a = this.scope) === null || _a === void 0 ? void 0 : _a[type];
        if (!value) {
            return Promise.reject(`DB ${type} not found`);
        }
        return this.api.request("/v2/kv/put", {
            key: db_name,
            value: value,
            ttl: -1
        }).then((response) => {
            return response.data;
        }).catch((err) => {
            console.log(err);
            return err;
        });
    }
    putAllDB(params) {
        const _DBs = [];
        params.forEach(item => _DBs.push(this.putDB(item.name, item.scope)));
        return axios_1.default.all(_DBs)
            .then(() => {
            return true;
        }).catch((err) => {
            console.log(err);
            return false;
        });
    }
    getScopeValue(key, scope = "global") {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.scope) === null || _a === void 0 ? void 0 : _a[scope]) === null || _b === void 0 ? void 0 : _b[key]) !== null && _c !== void 0 ? _c : null;
    }
    setScopeValue(key, value, scope = "global") {
        var _a;
        if (((_a = this.scope) === null || _a === void 0 ? void 0 : _a[scope]) && typeof key === 'string') {
            this.scope[scope][key] = `${value}`;
            return true;
        }
        return false;
    }
    getScopeAllValues(scope = "global") {
        return typeof this.scope[scope] !== "undefined" ? utils_1.default.clone(this.scope[scope]) : null;
    }
}
exports.default = DB;
