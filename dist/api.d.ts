import { AxiosResponse } from 'axios';
export default class api {
    private client;
    constructor(domain: string, token: string, isTest: boolean, url: string);
    request<T, R = AxiosResponse<T>>(requestUrl: any, data?: {}): Promise<R>;
}
