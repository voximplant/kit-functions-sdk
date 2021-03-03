import { ApiInstance, DataBaseType } from "./types";
/**
 * @hidden
 */
export default class DB {
    private scope;
    private api;
    constructor(api: ApiInstance);
    getDB(db_name: string): Promise<unknown>;
    putDB(db_name: string, type: DataBaseType): Promise<unknown>;
    getAllDB(_DBs: Promise<unknown>[]): Promise<void>;
    putAllDB(_DBs: Promise<unknown>[]): void;
    getScopeValue(key: string, scope?: DataBaseType): string;
    setScopeValue(key: string, value: any, scope?: DataBaseType): void;
    getScopeAllValues(scope?: DataBaseType): Record<string, string>;
}
