"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const qs = require("qs");
/**
 * @hidden
 */
const dict = {
    domain: 'domain parameter is not passed or is not a string',
    token: 'token parameter is not passed or is not a string',
    baseUrl: 'baseUrl parameter is not passed or is not a string',
    url: 'url parameter is not passed or is not a string',
};
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
            param.data = qs.stringify(param.data);
            if (typeof param.params === "undefined")
                param.params = {};
            checkParameter(domain, dict.domain);
            checkParameter(token, dict.token);
            param.params.domain = domain;
            param.params.access_token = token;
            return param;
        });
    }
    /**
     * Api request
     **/
    request(requestUrl, data) {
        checkParameter(requestUrl, dict.url);
        return this.client.request({
            url: requestUrl,
            data: data
        });
    }
}
exports.default = Api;
