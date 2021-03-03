import { ApiInstance, DataBaseType, DbResponse, ObjectType } from "./types";
/**
 * @hidden
 */
export default class DB {
    private scope;
    private api;
    constructor(api: ApiInstance);
    getDB(db_name: string): Promise<DbResponse>;
    putDB(db_name: string, type: DataBaseType): Promise<DbResponse | {
        result: any;
    }>;
    getAllDB(_DBs: Promise<DbResponse>[]): Promise<void>;
    putAllDB(_DBs: Promise<DbResponse>[]): void;
    getScopeValue(key: string, scope?: DataBaseType): string | null;
    setScopeValue(key: string, value: any, scope?: DataBaseType): void;
    getScopeAllValues(scope?: DataBaseType): ObjectType;
}
