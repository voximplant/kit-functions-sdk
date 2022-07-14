import { ApiInstance, DataBaseType, DateBasePutParams, ObjectType } from "./types";
/**
 * @hidden
 */
export default class DB {
    private scope;
    private api;
    constructor(api: ApiInstance);
    private getDB;
    getAllDB(names?: string[]): Promise<void>;
    private putDB;
    putAllDB(params: DateBasePutParams[]): Promise<boolean>;
    getScopeValue(key: string, scope?: DataBaseType): string | null;
    setScopeValue(key: string, value: any, scope?: DataBaseType): boolean;
    deleteScopeValue(key: string, scope: DataBaseType): boolean;
    getScopeAllValues(scope?: DataBaseType): ObjectType | null;
}
