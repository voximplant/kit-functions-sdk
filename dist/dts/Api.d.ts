import { AxiosResponse } from 'axios';
import { ApiInstance } from "./types";
/**
 * @hidden
 */
export default class Api implements ApiInstance {
    private client;
    constructor(domain: string, token: string, baseUrl: string);
    /**
     * Api request
     **/
    request<T, R = AxiosResponse<T>>(requestUrl: string, data: any): Promise<R>;
}
