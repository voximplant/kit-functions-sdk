import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import * as qs from 'qs';
import { ApiInstance } from "./types";


/**
 * @hidden
 */
export default class Api implements ApiInstance{
    private client:AxiosInstance;

    constructor(domain:string, token:string, isTest:boolean, url: string) {

        this.client = axios.create({
            baseURL: isTest ? "https://voximplant.xyz/api" : `https://${url}/api`,
            method: "POST",
            responseType: "json",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        this.client.interceptors.request.use((param: AxiosRequestConfig) => {
            param.data = qs.stringify(param.data);
            if (typeof param.params === "undefined") param.params = {};
            if (!token) throw new Error('token is a required parameter');

            param.params.domain = domain;
            param.params.access_token = token;

            return param
        });
    }

    /**
     * Api request
     **/
    request<T, R = AxiosResponse<T>> (requestUrl: string, data: any):Promise<R> {
        return this.client.request({
            url: requestUrl,
            data: data
        })
    }
}
