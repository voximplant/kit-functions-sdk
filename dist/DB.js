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
            return {};
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
            return {};
        });
    }
    getAllDB(_DBs) {
        return axios_1.default.all(_DBs).then(axios_1.default.spread((func, acc, conv) => {
            const functionDB = (typeof func !== "undefined" && typeof func.result !== "undefined" && func.result !== null) ? JSON.parse(func.result) : {};
            const accountDB = (typeof acc !== "undefined" && typeof acc.result !== "undefined" && acc.result !== null) ? JSON.parse(acc.result) : {};
            const conversationDB = (typeof conv !== "undefined" && typeof acc.result !== "undefined" && acc.result !== null) ? JSON.parse(conv.result) : {};
            this.scope = {
                function: functionDB,
                global: accountDB,
                conversation: conversationDB
            };
        }));
    }
    putAllDB(_DBs) {
        axios_1.default.all(_DBs).then(axios_1.default.spread((func, acc, conv) => {
            console.log("result", func, acc, conv);
        }));
    }
    getScopeValue(key, scope = "global") {
        return this.scope[scope][key];
    }
    setScopeValue(key, value, scope = "global") {
        this.scope[scope][key] = value;
    }
    getScopeAllValues(scope = "global") {
        return typeof this.scope[scope] !== "undefined" ? utils_1.default.clone(this.scope[scope]) : {};
    }
}
exports.default = DB;
