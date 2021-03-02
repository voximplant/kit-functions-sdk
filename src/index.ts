import axios, { AxiosInstance } from 'axios'
import Api from "./Api"
import DB from "./DB"
import {
  CallObject,
  ContextObject,
  QueueInfo,
  SkillObject,
  MessageObject,
  ApiInstance,
  DataBaseType
} from "./types";
import Message from "./Message";

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
  private DB: DB;
  private priority: number = 0;
  private http: AxiosInstance;

  eventType: EVENT_TYPES = EVENT_TYPES.webhook
  call: CallObject = null;
  variables: object = {};
  headers: object = {};
  skills: Array<SkillObject> = [];
  incomingMessage: MessageObject;
  replyMessage: MessageObject;
  api: ApiInstance;

  constructor(context: ContextObject, isTest: boolean = false) {
    this.incomingMessage = new Message();
    this.replyMessage = new Message(true);
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
    this.eventType = VoximplantKit.getHeaderValue(context, 'x-kit-event-type',  EVENT_TYPES.webhook);
    // Get access token
    this.accessToken = VoximplantKit.getHeaderValue(context, 'x-kit-access-token', '');
    // Get api url
    this.apiUrl = VoximplantKit.getHeaderValue(context, 'x-kit-api-url', 'kitapi-eu.voximplant.com');
    // Get domain
    this.domain = VoximplantKit.getHeaderValue(context, 'x-kit-domain', 'annaclover');
    // Get function ID
    this.functionId = VoximplantKit.getHeaderValue(context, 'x-kit-function-id', 88);
    // Get session access url
    this.sessionAccessUrl = VoximplantKit.getHeaderValue(context, 'x-kit-session-access-url', '')
    // Store call data
    this.call = this.getCallData()
    // Store variables data
    this.variables = this.getVariables()
    // Store skills data
    this.skills = this.getSkills()

    this.api = new Api(this.domain, this.accessToken, this.isTest, this.apiUrl);
    this.DB = new DB(this.api);

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

  private static getHeaderValue(context, name, defaultValue) {
    return (typeof context.request.headers[name] !== "undefined") ? context.request.headers[name] : defaultValue;
  }

  static default = VoximplantKit;

  /**
   * load Databases
   */
  public async loadDatabases() {
    const _DBs = [
      this.DB.getDB("function_" + this.functionId),
      this.DB.getDB("accountdb_" + this.domain)
    ];

    if (this.eventType === EVENT_TYPES.incoming_message) {
      _DBs.push(this.DB.getDB("conversation_" + this.incomingMessage.conversation.uuid))
    }

    await this.DB.getAllDB(_DBs);
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
    this.api = new Api(this.domain, this.accessToken, this.isTest, this.apiUrl)
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
   * @param name {String} - Variable name
   * @param value {String} - Variable value
   */
  public setVariable(name, value) {
    this.variables[name] = `${value}`;
  }

  /**
   * Delete variable
   * @param name {String} - Variable name
   */
  deleteVariable(name: string) {
    delete this.variables[name];
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

  /**
   * Save DB by scope name
   * @param type
   * @private
   */
  private saveDb(type: DataBaseType) {
    let _dbName = null;


    if (type === "function") {
      _dbName = "function_" + this.functionId
    }

    if (type === "global") {
      _dbName = "accountdb_" + this.domain
    }

    if (type === "conversation" && this.eventType == EVENT_TYPES.incoming_message) {
      _dbName = "conversation_" + this.incomingMessage.conversation.uuid
    }

    if (_dbName === null) return false

    return this.DB.putDB(_dbName, type)
  }

  /**
   * Get value from DB by key
   * @param key
   * @param scope
   */
  public dbGet(key: string, scope: DataBaseType = "global"): any {
    return this.DB.getScopeValue(key, scope);
  }

  /**
   * Set value in DB by key
   * @param key
   * @param value
   * @param scope {DataBaseType}
   */
  public dbSet(key: string, value: any, scope: DataBaseType = "global"): void {
    this.DB.setScopeValue(key, value, scope);
  }

  /**
   * Get all DB scope by name
   * @param scope
   */
  public dbGetAll(scope: DataBaseType = "global") {
    return this.DB.getScopeAllValues(scope);
  }

  /**
   * Commit DB changes
   */
  public async dbCommit() {
    const _DBs = [
      this.DB.putDB("function_" + this.functionId, 'function'),
      this.DB.putDB("accountdb_" + this.domain, 'global')
    ];

    if (this.eventType === EVENT_TYPES.incoming_message) {
      _DBs.push(this.DB.putDB("conversation_" + this.incomingMessage.conversation.uuid, 'conversation'))
    }

    this.DB.putAllDB(_DBs);
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
   * ```js
   * module.exports = async function(context, callback) {
   *  const kit = new VoximplantKit(context);
   *  kit.addPhoto('https://your-srite.com/img/some-photo.png');
   *  callback(200, kit.getResponseBody());
   *}
   * ```
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
    return "0.0.36"
  }
}

export = VoximplantKit;