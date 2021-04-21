import { ApiInstance, DataBaseType, DateBasePutParams, ObjectType } from "./types";
/**
 * @hidden
 */
export default class DB {
    private scope;
    private api;
    constructor(api: ApiInstance);
    private getDB;
    private putDB;
    getAllDB(names?: string[]): Promise<void>;
    putAllDB(params: DateBasePutParams[]): Promise<boolean>;
    getScopeValue(key: string, scope?: DataBaseType): string | null;
    setScopeValue(key: string, value: any, scope?: DataBaseType): boolean;
    getScopeAllValues(scope?: DataBaseType): ObjectType | null;
}
