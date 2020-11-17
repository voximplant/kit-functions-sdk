"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const qs = require("qs");
class api {
    constructor(domain, token, isTest, url) {
        this.client = axios_1.default.create({
            baseURL: isTest ? "https://voximplant.xyz/api" : `https://${url}/api`,
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
            if (!token)
                throw new Error('token is a required parameter');
            param.params.domain = domain;
            param.params.access_token = token;
            return param;
        });
    }
    request(requestUrl, data = {}) {
        return this.client.request({
            url: requestUrl,
            data: data
        });
    }
}
exports.default = api;
