import { ApiInstance, DataBase, DataBaseType, DateBasePutParams, DbResponse, ObjectType } from "./types";
import axios from "axios";
import utils from './utils';

/**
 * @hidden
 */
export default class DB {
  private scope: DataBase;
  private api: ApiInstance;

  constructor(api: ApiInstance) {
    this.api = api;
    this.scope = {
      function: {},
      global: {},
      conversation: {}
    };
  }

  private getDB(db_name: string): Promise<DbResponse> {
    return this.api.request("/v2/kv/get", {
      key: db_name
    }).then((response) => {
      return response.data as DbResponse;
    }).catch(() => {
      return { result: null }
    })
  }

  private putDB(db_name: string, type: DataBaseType) {
    const value = this.scope?.[type];

    if (!value) {
      console.log(`DB ${ type } not found`);
      return;
    }

    return this.api.request("/v2/kv/put", {
      key: db_name,
      value: value,
      ttl: -1
    }).then((response) => {
      return response.data as DbResponse
    }).catch(() => {
      return { result: null }
    })
  }

  public getAllDB(names: string[] = []) {
    const _DBs: Promise<DbResponse>[] = [];
    names.forEach((name) => _DBs.push(this.getDB(name)));

    return axios.all(_DBs).then(axios.spread((func: DbResponse, acc: DbResponse, conv?: DbResponse) => {
      const functionDB = (typeof func !== "undefined" && func?.result) ? JSON.parse(func.result) : {}
      const accountDB = (typeof acc !== "undefined" && acc?.result) ? JSON.parse(acc.result) : {}
      const conversationDB = (typeof conv !== "undefined" && conv?.result) ? JSON.parse(conv.result) : {}

      this.scope = {
        function: functionDB,
        global: accountDB,
        conversation: conversationDB
      };
    })).catch((err) => {
      console.log(err);
    })
  }


  public putAllDB(params: DateBasePutParams[]): Promise<boolean> {
    const _DBs: Promise<DbResponse>[]  = [];
    params.forEach(item => _DBs.push(this.putDB(item.name, item.scope)));

    return axios.all(_DBs)
      .then(axios.spread(() => {
      return true;
    })).catch((err) => {
      console.log(err);
      return false;
    })
  }

  public getScopeValue(key: string, scope: DataBaseType = "global"): string | null {
    return this.scope?.[scope]?.[key] ?? null;
  }

  public setScopeValue(key: string, value: any, scope: DataBaseType = "global"): boolean {
    if (this.scope?.[scope] && typeof key === 'string') {
      this.scope[scope][key] = `${value}`;
      return true;
    }
    return false;
  }

  public getScopeAllValues(scope: DataBaseType = "global"): ObjectType | null {
    return typeof this.scope[scope] !== "undefined" ? utils.clone(this.scope[scope]) as ObjectType : null;
  }
}