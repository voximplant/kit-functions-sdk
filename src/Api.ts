import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import * as qs from 'qs';
import { ApiInstance } from "./types";

/**
 * @hidden
 */
const dict = {
    domain: 'domain parameter is not passed or is not a string',
    token: 'token parameter is not passed or is not a string',
    baseUrl: 'baseUrl parameter is not passed or is not a string',
    url: 'url parameter is not passed or is not a string',
}

/**
 * @hidden
 */
const checkParameter = (param, errorText: string): true | Error => {
    if(!!(param && typeof param === 'string' && param.length)) {
        return true;
    } else {
        throw new Error(errorText)
    }
}
/**
 * @hidden
 */
export default class Api implements ApiInstance{
    private client:AxiosInstance;

    constructor(domain:string, token:string, baseUrl: string) {
        checkParameter(domain, dict.domain);
        checkParameter(token, dict.token);
        checkParameter(baseUrl, dict.baseUrl);

        this.client = axios.create({
            baseURL: `https://${baseUrl}/api`,
            method: "POST",
            responseType: "json",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.client.interceptors.request.use((param: AxiosRequestConfig) => {
            param.data = qs.stringify(param.data);
            if (typeof param.params === "undefined") param.params = {};

            param.params.domain = domain;
            param.params.access_token = token;

            return param
        });
    }

    request<T, R = AxiosResponse<T>> (requestUrl: string, data: any):Promise<R> {
        checkParameter(requestUrl, dict.url);
        return this.client.request({
            url: requestUrl,
            data: data
        })
    }
}
