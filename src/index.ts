import axios, { AxiosInstance } from 'axios'
import Balab from "./Api"
import DB from "./DB"
import {
  CallObject,
  ContextObject,
  QueueInfo,
  SkillObject,
  MessageObject,
  ApiInstance,
  DataBaseType, RequestData, RequestObjectCallBody
} from "./types";
import Message from "./Message";
import utils from './utils';

const enum EVENT_TYPES {
  in_call_function = "in_call_function",
  incoming_message = "incoming_message",
  webhook = "webhook"
}

class VoximplantKit {
  private isTest: boolean;
  private requestData: RequestData = {}
  private accessToken: string = ''
  private sessionAccessUrl: string = ''
  private apiUrl: string = ''
  private domain: string = ''
  private functionId: number = 0;
  private DB: DB;
  private priority: number = 0;
  private http: AxiosInstance;
  private api: ApiInstance;
  private callHeaders = {};
  private variables: Record<string, string> = {};
  private call: CallObject = null;
  private skills: Array<SkillObject> = [];
  private incomingMessage: MessageObject;
  private replyMessage: MessageObject;
  private eventType: EVENT_TYPES = EVENT_TYPES.webhook

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
    this.requestData = context.request.body;
    // Get event type
    this.eventType = utils.getHeaderValue(context, 'x-kit-event-type', EVENT_TYPES.webhook) as EVENT_TYPES;
    // Get access token
    this.accessToken = utils.getHeaderValue(context, 'x-kit-access-token', '') as string;
    // Get api url
    this.apiUrl = utils.getHeaderValue(context, 'x-kit-api-url', 'kitapi-eu.voximplant.com') as string;
    // Get domain
    this.domain = utils.getHeaderValue(context, 'x-kit-domain', '') as string;
    // Get function ID
    this.functionId = utils.getHeaderValue(context, 'x-kit-function-id', 0) as number;
    // Get session access url
    this.sessionAccessUrl = utils.getHeaderValue(context, 'x-kit-session-access-url', '') as string;
    // Store call data
    this.call = this.getCallData()
    // Store variables data
    this.variables = this.getVariablesFromContext();
    // Store skills data
    this.skills = this.getSkills()
    // Store Call headers
    this.callHeaders = this.getCallHeaders();
    this.api = new Balab(this.domain, this.accessToken, this.isTest, this.apiUrl);
    this.DB = new DB(this.api);

    if (this.eventType === EVENT_TYPES.incoming_message) {
      this.incomingMessage = this.getIncomingMessage()
      this.replyMessage.type = (this.requestData as MessageObject).type
      this.replyMessage.sender.is_bot = true
      this.replyMessage.conversation = utils.clone((this.requestData as MessageObject).conversation)
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
  public getIncomingMessage(): MessageObject | null {
    return this.eventType === EVENT_TYPES.incoming_message ? utils.clone((this.requestData as MessageObject)) : null;
  }

  /**
   * Set auth token
   * @param token
   */
  public setAccessToken(token: string) {
    // TODO why use this method?
    this.accessToken = token;
    this.api = new Balab(this.domain, this.accessToken, this.isTest, this.apiUrl)
  }

  /**
   * Get Variable
   * @param name
   */
  public getVariable(name: string): string | null {
    return (typeof this.variables[name] !== "undefined") ? this.variables[name] : null
  }

  /**
   * Set variable
   * @param name {String} - Variable name
   * @param value {String} - Variable value
   */
  public setVariable(name: string, value: string): void {
    this.variables[name] = `${ value }`;
  }

  /**
   * Delete variable
   * @param name {String} - Variable name
   */
  deleteVariable(name: string) {
    delete this.variables[name];
  }

  public getCallHeaders(): Record<string, string> | null {
    const headers = (this.requestData as RequestObjectCallBody).HEADERS;
    return headers ? utils.clone(headers) : null;
  }

  /**
   * Get all call data
   */
  public getCallData(): CallObject | null {
    const call = (this.requestData as RequestObjectCallBody).CALL;
    return (typeof call !== "undefined") ? utils.clone(call) : null;
  }

  /**
   * Get all variables
   */
  private getVariablesFromContext(): Record<string, string> {
    let variables = {};

    if (this.eventType === EVENT_TYPES.incoming_message) {
      variables = (this.requestData as MessageObject)?.conversation?.custom_data?.request_data?.variables || {}
    } else if (this.eventType === EVENT_TYPES.in_call_function) {
      variables = (this.requestData as RequestObjectCallBody)?.VARIABLES || {};
    }

    return utils.clone(variables);
  }

  public getVariables(): Record<string, string> {
    return utils.clone(this.variables);
  }

  /**
   * Get all skills
   */
  public getSkills(): SkillObject[] {
    const skills = (this.requestData as RequestObjectCallBody).SKILLS;
    return (typeof skills !== "undefined") ? utils.clone(skills) : [];
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
    // TODO why use this method?
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
  public dbGet(key: string, scope: DataBaseType = "global"): string | null {
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
    return utils.clone(this.DB.getScopeAllValues(scope));
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
    return "0.0.37"
  }
}

export = VoximplantKit;