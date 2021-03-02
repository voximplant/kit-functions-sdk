import { ApiInstance, ObjectType, DataBase, DataBaseType } from "./types";
import axios from "axios";

/**
 * @hidden
 */
export default class DB {
  private scope: DataBase;
  private api: ApiInstance;

  constructor(api: ApiInstance) {
    this.api = api;
    this.scope = {
      function: {} ,
      global: {},
      conversation: {}
    };
  }

  public getDB(db_name: string) {
    return this.api.request("/v2/kv/get", {
      key: db_name
    }).then((response) => {
      return response.data
    }).catch(e => {
      return {}
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
      return response.data
    }).catch(e => {
      return {}
    })
  }

  public getAllDB(_DBs) {
    return axios.all(_DBs).then(axios.spread((func: ObjectType, acc: ObjectType, conv?: ObjectType) => {
      const functionDB = (typeof func !== "undefined" && typeof func.result !== "undefined" && func.result !== null) ? JSON.parse(func.result) : {}
      const accountDB = (typeof acc !== "undefined" && typeof acc.result !== "undefined" && acc.result !== null) ? JSON.parse(acc.result) : {}
      const conversationDB = (typeof conv !== "undefined" && typeof acc.result !== "undefined" && acc.result !== null) ? JSON.parse(conv.result) : {}

      this.scope = {
        function: functionDB,
        global: accountDB,
        conversation: conversationDB
      };
    }));
  }

  public putAllDB(_DBs) {
    axios.all(_DBs).then(axios.spread((func, acc, conv?) => {
      console.log("result", func, acc, conv)
    }))
  }

  public getScopeValue(key: string, scope: DataBaseType = "global"): ObjectType {
    return this.scope[scope]
  }

  public setScopeValue(key: string, value: any, scope: DataBaseType = "global"): void {
    this.scope[scope][key] = value;
  }

  public getScopeAllValues(scope: DataBaseType = "global"): ObjectType {
    return typeof this.scope[scope] !== "undefined" ? this.scope[scope] as ObjectType : {}
  }
}