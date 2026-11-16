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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const qs = __importStar(require("qs"));
/**
 * @hidden
 */
const dict = {
    domain: 'domain parameter is not passed or is not a string',
    token: 'token parameter is not passed or is not a string',
    baseUrl: 'baseUrl parameter is not passed or is not a string',
    url: 'url parameter is not passed or is not a string',
};
/**
 * @hidden
 */
const checkParameter = (param, errorText) => {
    if (!!(param && typeof param === 'string' && param.length)) {
        return true;
    }
    else {
        throw new Error(errorText);
    }
};
/**
 * @hidden
 */
class Api {
    constructor(domain, token, baseUrl) {
        checkParameter(domain, dict.domain);
        checkParameter(token, dict.token);
        checkParameter(baseUrl, dict.baseUrl);
        this.client = axios_1.default.create({
            baseURL: `https://${baseUrl}/api`,
            method: "POST",
            responseType: "json",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        this.client.interceptors.request.use((param) => {
            param.data = param.data || '';
            if (param.data !== '') {
                param.data = qs.stringify(param.data);
            }
            if (typeof param.params === "undefined")
                param.params = {};
            param.params.domain = domain;
            param.params.access_token = token;
            return param;
        });
    }
    request(requestUrl, data) {
        checkParameter(requestUrl, dict.url);
        return this.client.request({
            url: requestUrl,
            data: data
        });
    }
}
exports.default = Api;
