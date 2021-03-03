import { ApiInstance, ObjectType, DataBaseType } from "./types";
/**
 * @hidden
 */
export default class DB {
    private scope;
    private api;
    constructor(api: ApiInstance);
    getDB(db_name: string): Promise<unknown>;
    putDB(db_name: string, type: DataBaseType): Promise<unknown>;
    getAllDB(_DBs: any): Promise<void>;
    putAllDB(_DBs: any): void;
    getScopeValue(key: string, scope?: DataBaseType): ObjectType;
    setScopeValue(key: string, value: any, scope?: DataBaseType): void;
    getScopeAllValues(scope?: DataBaseType): ObjectType;
}
