import { AxiosResponse } from 'axios';
import { ApiInstance } from "./types";
/**
 * @hidden
 */
export default class api implements ApiInstance {
    private client;
    constructor(domain: string, token: string, isTest: boolean, url: string);
    request<T, R = AxiosResponse<T>>(requestUrl: string, data: any): Promise<R>;
}
