import { ApiInstance, DataBase, DataBaseType, DbResponse, ObjectType } from "./types";
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

  public getDB(db_name: string): Promise<DbResponse> {
    return this.api.request("/v2/kv/get", {
      key: db_name
    }).then((response) => {
      return response.data as DbResponse;
    }).catch(() => {
      return { result: null }
    })
  }

  public putDB(db_name: string, type: DataBaseType) {
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

  public getAllDB(_DBs: Promise<DbResponse>[]) {
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


  public putAllDB(_DBs: Promise<DbResponse>[]) {
    axios.all(_DBs).then(axios.spread((func: DbResponse, acc: DbResponse, conv?: DbResponse) => {
      console.log("result", func, acc, conv)
    })).catch((err) => {
      console.log(err);
    })
  }

  public getScopeValue(key: string, scope: DataBaseType = "global"): string | null {
    return this.scope?.[scope]?.[key] || null;
  }

  public setScopeValue(key: string, value: any, scope: DataBaseType = "global"): boolean {
    if (this.scope?.[scope]?.[key]) {
      this.scope[scope][key] = value;
      return true;
    }
    return false;
  }

  public getScopeAllValues(scope: DataBaseType = "global"): ObjectType | null {
    return typeof this.scope[scope] !== "undefined" ? utils.clone(this.scope[scope]) as ObjectType : null;
  }
}