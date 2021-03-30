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
  DataBaseType, RequestData, RequestObjectCallBody, ObjectType
} from "./types";
import Message from "./Message";
import utils from './utils';

/**
 * @hidden
 */
const enum EVENT_TYPES {
  in_call_function = "in_call_function",
  incoming_message = "incoming_message",
  webhook = "webhook"
}

class VoximplantKit {
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
  private callHeaders: ObjectType = {};
  private variables: ObjectType = {};
  private call: CallObject = null;
  private skills: Array<SkillObject> = [];
  private eventType: EVENT_TYPES = EVENT_TYPES.webhook;
  private replyMessage: MessageObject;
  private incomingMessage: MessageObject;

  /**
   * The class VoximplantKit is a middleware for working with functions
   * ```js
   * module.exports = async function(context, callback) {
   *  // Initializing a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // Some code
   *  console.log(Date.now());
   *  // End of function work
   *  callback(200, kit.getResponseBody());
   *}
   * ```
   */
  constructor(context: ContextObject) {
    this.incomingMessage = new Message();
    this.replyMessage = new Message(true);
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
    this.call = this.getRequestDataProperty('CALL') as CallObject;
    // Store Call headers
    this.callHeaders = this.getRequestDataProperty('HEADERS');
    // Store variables data
    this.variables = this.getRequestDataVariables();
    // Store skills data
    this.skills = this.getRequestDataProperty('SKILLS', []) as SkillObject[]//this.getSkills()

    this.api = new Api(this.domain, this.accessToken, this.apiUrl);
    this.DB = new DB(this.api);

    if (this.isMessage()) {
      this.incomingMessage = utils.clone(this.requestData) as MessageObject;
      this.replyMessage.type = (this.requestData as MessageObject).type;
      this.replyMessage.sender.is_bot = true;
      this.replyMessage.conversation = utils.clone((this.requestData as MessageObject).conversation);
      this.replyMessage.payload.push({
        type: "properties",
        message_type: "text"
      });
    }
  }

  /**
   * @hidden
   */
  static default = VoximplantKit;

  private getRequestDataProperty(name: string, defaultProp: {} | [] = {}) {
    const prop = (this.requestData as RequestData)?.[name];
    return prop ? utils.clone(prop) : defaultProp;
  }

  private getRequestDataVariables(): ObjectType {
    let variables = {};

    if (this.isMessage()) {
      variables = (this.requestData as MessageObject)?.conversation?.custom_data?.request_data?.variables || {}
    } else if (this.isCall()) {
      variables = (this.requestData as RequestObjectCallBody)?.VARIABLES || {};
    }

    return utils.clone(variables);
  }

  /**
   * load Databases
   * ```js
   *  // Initializing a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  try {
   *    // Connecting the internal database
   *    await kit.loadDatabases();
   *    // Reading the contents of the database
   *    const scopes = kit.dbGetAll();
   *    console.log(scopes)
   *  } catch(err) {
   *    console.log(err);
   *  }
   * ```
   */
  public async loadDatabases() {
    const _DBs = [
      this.DB.getDB("function_" + this.functionId),
      this.DB.getDB("accountdb_" + this.domain)
    ];

    if (this.isMessage()) {
      _DBs.push(this.DB.getDB("conversation_" + this.incomingMessage.conversation.uuid))
    }

    return await this.DB.getAllDB(_DBs);
  }

  /**
   * Get function response
   * @param data
   */
  public getResponseBody(data: any) {
    if (this.isCall())
      return {
        "VARIABLES": this.variables,
        "SKILLS": this.skills
      }

    if (this.isMessage()) {
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
   * Get incoming message (Read only)
   */
  public getIncomingMessage(): MessageObject | null {
    return this.isMessage() ? utils.clone((this.incomingMessage as MessageObject)) : null;
  }

  public setReplyMessageText(text: string) {
    if (typeof text === "string") {
      this.replyMessage.text = text;
      return true;
    }

    return false;
  }

  /**
   * The function was called from a call
   */
  public isCall(): boolean {
    return this.eventType === EVENT_TYPES.in_call_function;
  }

  /**
   * The function was called from a message
   */
  public isMessage(): boolean {
    return this.eventType === EVENT_TYPES.incoming_message;
  }

  /**
   * Get Variable
   * @param name
   */
  public getVariable(name: string): string | null {
    return (typeof name === 'string' && typeof this.variables[name] !== "undefined") ? this.variables[name] : null
  }

  /**
   * Set variable
   * @param name {String} - Variable name
   * @param value {String} - Variable value
   */
  public setVariable(name: string, value: string): boolean {
    if (typeof name === 'string' && typeof value === 'string') {
      this.variables[name] = value;
      return true;
    }
    return false;
  }

  /**
   * Delete variable
   * @param name {String} - Variable name
   */
  deleteVariable(name: string) {
    if (typeof name === 'string') {
      delete this.variables[name];
    }
  }

  public getCallHeaders(): ObjectType | null {
    return this.isCall() ? utils.clone(this.callHeaders) : null;
  }

  /**
   * Get all call data
   */
  public getCallData(): CallObject | null {
    return this.isCall() ? utils.clone(this.call) : null;
  }

  public getVariables(): ObjectType {
    return utils.clone(this.variables);
  }

  /**
   * Get all skills
   */
  public getSkills(): SkillObject[] {
    return utils.clone(this.skills);
  }

  /**
   * Set skill
   * @param name
   * @param level
   */
  public setSkill(name: string, level: number): boolean {
    if (typeof name !== 'string' || typeof level !== 'number') return false;

    const skillIndex = this.skills.findIndex(skill => {
      return skill.skill_name === name
    })
    if (skillIndex === -1) this.skills.push({
      "skill_name": name,
      "level": level
    })
    else this.skills[skillIndex].level = level;

    return true;
  }

  /**
   * Remove skill
   * @param name
   */
  public removeSkill(name: string): boolean {
    const skillIndex = this.skills.findIndex(skill => {
      return skill.skill_name === name
    })
    if (skillIndex > -1) {
      this.skills.splice(skillIndex, 1);
      return true;
    }
    return false;
  }

  public setPriority(value: number): boolean {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10) {
      this.priority = value;
      return true;
    } else {
      console.warn(`The value ${ value } cannot be set as a priority. An integer from 0 to 10 is expected`);
      return false;
    }
  }

  public getPriority(): number {
    return this.priority;
  }

  /**
   * Finish current request in conversation
   */
  public finishRequest(): boolean {
    if (!this.isMessage()) return false
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
    });

    if (payloadIndex > -1) {
      this.replyMessage.payload.splice(payloadIndex, 1)
    }

    return true
  }

  /**
   * Transfer to queue
   */
  public transferToQueue(queue: QueueInfo) {
    if (!this.isMessage()) return false;

    if (typeof queue.queue_id === "undefined") queue.queue_id = null;
    if (typeof queue.queue_name === "undefined") queue.queue_name = null;

    // TODO find out if there should be an OR operator
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
  private async saveDb(type: DataBaseType): Promise<boolean> {
    // TODO find out why use this method?
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

    await this.DB.putDB(_dbName, type);
    return true;
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
  public dbSet(key: string, value: any, scope: DataBaseType = "global"): boolean {
    return this.DB.setScopeValue(key, value, scope);
  }

  /**
   * Get all DB scope by name
   * @param scope
   */
  public dbGetAll(scope: DataBaseType = "global"): ObjectType | null {
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

    if (this.isMessage()) {
      _DBs.push(this.DB.putDB("conversation_" + this.incomingMessage.conversation.uuid, 'conversation'))
    }

    try {
      return await this.DB.putAllDB(_DBs);
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  /**
   * Voximplant Kit API proxy
   * ```js
   * // Example of getting an account name
   * module.exports = async function(context, callback) {
   *  const kit = new VoximplantKit(context);
   *  try {
   *     const { success, result } = await kit.apiProxy('/v2/account/getAccountInfo');
   *     if (success) {
   *        console.log('Account name', result.domain.name);
   *     }
   *  } catch (err) {
   *     console.log(err);
   *  }
   *  callback(200, kit.getResponseBody());
   *}
   * ```
   * @param url {string} - Url address
   * @param data
   */
  public apiProxy(url: string, data: any) {
    return this.api.request(url, data).then(r => {
      return r.data
    }).catch(err => {
      console.log(err);
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
  private addPhoto(url: string) {
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
    return "0.0.39"
  }
}

export = VoximplantKit;