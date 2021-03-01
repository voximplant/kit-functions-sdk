import axios, { AxiosInstance } from 'axios'
import api from "./api"
import { CallObject, ContextObject, QueueInfo, ResponseDataObject, SkillObject } from "./types";
import MessageObject from "./MessageObject";

const enum EVENT_TYPES {
  in_call_function = "in_call_function",
  incoming_message = "incoming_message",
  webhook = "webhook"
}

class VoximplantKit {
  private isTest: boolean;
  private requestData: any = {}
  private accessToken: string = null
  private sessionAccessUrl: string = null
  private apiUrl: string = null
  private domain: string = null
  private functionId: number = null

  eventType: EVENT_TYPES = EVENT_TYPES.webhook
  call: CallObject = null;
  variables: object = {};
  headers: object = {};
  skills: Array<SkillObject> = [];
  private priority: number = 0;

  incomingMessage: MessageObject;
  replyMessage: MessageObject;

  private conversationDB: any = {};
  private functionDB: any = {};
  private accountDB: any = {};
  private db: any = {};

  api: any;
  private http: AxiosInstance;

  constructor(context: ContextObject, isTest: boolean = false) {
    this.incomingMessage = new MessageObject();
    this.replyMessage = new MessageObject(true);
    this.isTest = isTest
    this.http = axios

    if (typeof context === 'undefined' || typeof context.request === "undefined") {
      context = {
        request: {
          body: {},
          headers: {}
        }
      }
    }

    // Store request data
    this.requestData = context.request.body
    // Get event type
    this.eventType = (typeof context.request.headers["x-kit-event-type"] !== "undefined") ? context.request.headers["x-kit-event-type"] : EVENT_TYPES.webhook
    // Get access token
    this.accessToken = (typeof context.request.headers["x-kit-access-token"] !== "undefined") ? context.request.headers["x-kit-access-token"] : ""
    // Get api url
    this.apiUrl = (typeof context.request.headers["x-kit-api-url"] !== "undefined") ? context.request.headers["x-kit-api-url"] : "kitapi-eu.voximplant.com"
    // Get domain
    this.domain = (typeof context.request.headers["x-kit-domain"] !== "undefined") ? context.request.headers["x-kit-domain"] : "annaclover"
    // Get function ID
    this.functionId = (typeof context.request.headers["x-kit-function-id"] !== "undefined") ? context.request.headers["x-kit-function-id"] : 88
    // Get session access url
    this.sessionAccessUrl = (typeof context.request.headers["x-kit-session-access-url"] !== "undefined") ? context.request.headers["x-kit-session-access-url"] : ""
    // Store call data
    this.call = this.getCallData()
    // Store variables data
    this.variables = this.getVariables()
    // Store skills data
    this.skills = this.getSkills()

    this.api = new api(this.domain, this.accessToken, this.isTest, this.apiUrl)

    if (this.eventType === EVENT_TYPES.incoming_message) {
      this.incomingMessage = this.getIncomingMessage()
      this.replyMessage.type = this.requestData.type
      this.replyMessage.sender.is_bot = true
      this.replyMessage.conversation = this.requestData.conversation
      this.replyMessage.payload.push({
        type: "properties",
        message_type: "text"
      });
    }
  }

  static default = VoximplantKit;

  /**
   * load Databases
   */
  public async loadDatabases() {
    let _this = this
    let _DBs = [
      this.loadDB("function_" + this.functionId),
      this.loadDB("accountdb_" + this.domain)
    ];

    if (this.eventType === EVENT_TYPES.incoming_message) {
      _DBs.push(this.loadDB("conversation_" + this.incomingMessage.conversation.uuid))
    }

    await axios.all(_DBs).then(axios.spread((func, acc, conv?) => {
      _this.functionDB = (typeof func !== "undefined" && typeof func?.result !== "undefined" && func.result !== null) ? JSON.parse(func.result) : {}
      _this.accountDB = (typeof acc !== "undefined" && typeof acc.result !== "undefined" && acc.result !== null) ? JSON.parse(acc.result) : {}
      _this.conversationDB = (typeof conv !== "undefined" && typeof acc.result !== "undefined" && acc.result !== null) ? JSON.parse(conv.result) : {}
      _this.db = {
        function: _this.functionDB,
        global: _this.accountDB,
        conversation: _this.conversationDB
      }
    }))
  }

  public setPriority(value: number) {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10) {
      this.priority = value;
    } else {
      console.warn(`The value ${ value } cannot be set as a priority. An integer from 0 to 10 is expected`)
    }
    return this.priority;
  }

  public getPriority() {
    return this.priority;
  }

  /**
   * Get function response
   * @param data
   */
  public getResponseBody(data: any) {
    if (this.eventType === EVENT_TYPES.in_call_function)
      return {
        "VARIABLES": this.variables,
        "SKILLS": this.skills
      }
    if (this.eventType === EVENT_TYPES.incoming_message) {
      const payloadIndex = this.replyMessage.payload.findIndex(item => {
        return item.type === "cmd" && item.name === "transfer_to_queue"
      })

      if (payloadIndex !== -1) {
        this.replyMessage.payload[payloadIndex].skills = this.skills;
        this.replyMessage.payload[payloadIndex].priority = this.priority;
      }

      return {
        text: this.replyMessage.text,
        payload: this.replyMessage.payload,
        variables: this.variables
      }
    } else
      return data
  }

  /**
   * Get incoming message
   */
  public getIncomingMessage(): MessageObject {
    return this.requestData
  }

  /**
   * Set auth token
   * @param token
   */
  public setAccessToken(token) {
    this.accessToken = token;
    this.api = new api(this.domain, this.accessToken, this.isTest, this.apiUrl)
  }

  /**
   * Get Variable
   * @param name
   */
  public getVariable(name: string) {
    return (typeof this.variables[name] !== "undefined") ? this.variables[name] : null
  }

  /**
   * Set variable
   * @param name
   * @param value
   */
  public setVariable(name, value) {
    this.variables[name] = value
  }

  /**
   * Get all call data
   */
  public getCallData() {
    return (typeof this.requestData.CALL !== "undefined") ? this.requestData.CALL : null
  }

  /**
   * Get all variables
   */
  public getVariables(): { [key: string]: string } {
    let variables = {};

    if (this.eventType === EVENT_TYPES.incoming_message) {
      variables = this.requestData?.conversation?.custom_data?.request_data?.variables || {}
    } else if (this.eventType === EVENT_TYPES.in_call_function) {
      variables = this.requestData?.VARIABLES || {};
    }

    return variables;
  }

  /**
   * Get all skills
   */
  public getSkills() {
    return (typeof this.requestData.SKILLS !== "undefined") ? this.requestData.SKILLS : []
  }

  /**
   * Set skill
   * @param name
   * @param level
   */
  public setSkill(name: string, level: number) {
    const skillIndex = this.skills.findIndex(skill => {
      return skill.skill_name === name
    })
    if (skillIndex === -1) this.skills.push({
      "skill_name": name,
      "level": level
    })
    else this.skills[skillIndex].level = level
  }

  /**
   * Remove skill
   * @param name
   */
  public removeSkill(name: string) {
    const skillIndex = this.skills.findIndex(skill => {
      return skill.skill_name === name
    })
    if (skillIndex > -1) {
      this.skills.splice(skillIndex, 1)
    }
  }

  /**
   * Finish current request in conversation
   */
  public finishRequest() {
    if (this.eventType !== EVENT_TYPES.incoming_message) return false
    const payloadIndex = this.replyMessage.payload.findIndex(item => {
      return item.type === "cmd" && item.name === "finish_request"
    })
    if (payloadIndex === -1) {
      this.replyMessage.payload.push({
        type: "cmd",
        name: "finish_request"
      })
    }
    return true
  }

  /**
   * Cancel finish current request in conversation
   */
  public cancelFinishRequest() {
    const payloadIndex = this.replyMessage.payload.findIndex(item => {
      return item.type === "cmd" && item.name === "finish_request"
    })
    if (payloadIndex > -1) {
      this.replyMessage.payload.splice(payloadIndex, 1)
    }

    return true
  }

  /**
   * Transfer to queue
   */
  public transferToQueue(queue: QueueInfo) {
    if (this.eventType !== EVENT_TYPES.incoming_message) return false

    if (typeof queue.queue_id === "undefined") queue.queue_id = null;
    if (typeof queue.queue_name === "undefined") queue.queue_name = null;

    if (queue.queue_id === null && queue.queue_name === null) return false

    const payloadIndex = this.replyMessage.payload.findIndex(item => {
      return item.type === "cmd" && item.name === "transfer_to_queue"
    })
    if (payloadIndex > -1) {
      this.replyMessage.payload[payloadIndex].queue = queue
    } else {
      this.replyMessage.payload.push({
        type: "cmd",
        name: "transfer_to_queue",
        queue: queue,
        skills: []
      })
    }

    return true
  }

  /**
   * Cancel transfer to queue
   */
  public cancelTransferToQueue() {
    const payloadIndex = this.replyMessage.payload.findIndex(item => {
      return item.type === "cmd" && item.name === "transfer_to_queue"
    })
    if (payloadIndex > -1) {
      this.replyMessage.payload.splice(payloadIndex, 1)
    }

    return true
  }

  private loadDB(db_name: string) {
    return this.api.request("/v2/kv/get", {
      key: db_name
    }).then((response) => {
      return response.data
    }).catch(e => {
      return {}
    })
  }

  private saveDB(db_name: string, value: string) {
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

  /**
   * Save DB by scope name
   * @param type
   * @private
   */
  private saveDb(type: string) {
    let _dbName = null
    let _dbValue = null

    if (type === "function") {
      _dbName = "function_" + this.functionId
      _dbValue = this.functionDB
    }

    if (type === "account") {
      _dbName = "accountdb_" + this.domain
      _dbValue = this.accountDB
    }

    if (type === "conversation" && this.eventType == EVENT_TYPES.incoming_message) {
      _dbName = "conversation_" + this.incomingMessage.conversation.uuid
      _dbValue = this.conversationDB
    }

    if (_dbName === null) return false

    return this.saveDB(_dbName, JSON.stringify(_dbValue))
  }

  /**
   * Get value from DB by key
   * @param key
   * @param scope
   */
  public dbGet(key: string, scope: string = "global"): any {
    return this.db[scope]
  }

  /**
   * Set value in DB by key
   * @param key
   * @param value
   * @param scope
   */
  public dbSet(key: string, value: any, scope: string = "global"): void {
    this.db[scope][key] = value
  }

  /**
   * Get all DB scope by name
   * @param scope
   */
  public dbGetAll(scope: string = "global") {
    return typeof this.db[scope] !== "undefined" ? this.db[scope] : null
  }

  /**
   * Commit DB changes
   */
  public async dbCommit() {
    let _this = this
    let _DBs = [
      this.saveDB("function_" + this.functionId, JSON.stringify(this.db.function)),
      this.saveDB("accountdb_" + this.domain, JSON.stringify(this.db.global))
    ];

    if (this.eventType === EVENT_TYPES.incoming_message) {
      _DBs.push(this.saveDB("conversation_" + this.incomingMessage.conversation.uuid, JSON.stringify(this.db.conversation)))
    }

    await axios.all(_DBs).then(axios.spread((func, acc, conv?) => {
      console.log("result", func, acc, conv)
    }))
  }

  /**
   * Send SMS message
   * @param from
   * @param to
   * @param message
   */
  public sendSMS(from: string, to: string, message: string) {
    return this.api.request("/v2/phone/sendSms", {
      source: from,
      destination: to,
      sms_body: message
    }).then(r => {
      return r.data
    })
  }

  /**
   * Voximplant Kit API proxy
   * @param url {string} - Url address
   * @param data
   */
  public apiProxy(url: string, data: any) {
    return this.api.request(url, data).then(r => {
      return r.data
    })
  }

  /**
   * Add photo
   * @param url {String} - Url address
   * @returns {Boolean}
   */
  public addPhoto(url: string) {
    this.replyMessage.payload.push({
      type: "photo",
      url: url,
      file_name: "file",
      file_size: 123
    })

    return true
  }

  /**
   * Get client version
   */
  public version() {
    return "0.0.35"
  }
}

export = VoximplantKit;