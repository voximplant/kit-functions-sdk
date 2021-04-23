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
  DataBaseType, RequestData, RequestObjectCallBody, ObjectType, DateBasePutParams
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
   * Voximplant Kit class, a middleware for working with functions.
   * ```js
   * module.exports = async function(context, callback) {
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // Some code
   *  console.log(Date.now());
   *  // End of function
   *  callback(200, kit.getResponseBody());
   *}
   * ```
   */
  constructor(context: ContextObject) {
    this.incomingMessage = new Message();
    this.replyMessage = new Message(true);
    this.http = axios

    if (typeof context === 'undefined') {
      throw new Error('The context parameter is required');
    }

    if (typeof context.request === "undefined") {
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
    this.accessToken = utils.getHeaderValue(context, 'x-kit-access-token', 'test') as string;
    // Get api url
    this.apiUrl = utils.getHeaderValue(context, 'x-kit-api-url', 'kitapi-eu.voximplant.com') as string;
    // Get domain
    this.domain = utils.getHeaderValue(context, 'x-kit-domain', 'test') as string;
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
   * Loads the databases available in the scope.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  try {
   *    // Connect available databases
   *    await kit.loadDatabases();
   *    // Read contents from the global scope
   *    const global_scope = kit.dbGetAll('global');
   *    console.log(global_scope)
   *  } catch(err) {
   *    console.log(err);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public async loadDatabases() {
    /*const _DBs = [
      this.DB.getDB("function_" + this.functionId),
      this.DB.getDB("accountdb_" + this.domain)
    ];

    if (this.isMessage()) {
      _DBs.push(this.DB.getDB("conversation_" + this.incomingMessage.conversation.uuid))
    }*/

    const names = [
      'function_' + this.functionId,
      'accountdb_' + this.domain,
    ]

    if (this.isMessage()) {
      names.push('conversation_' + this.incomingMessage.conversation.uuid)
    }

    return await this.DB.getAllDB(names);
  }

  /**
   * Gets a function response. Needs to be called at the end of each function.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getResponseBody() {
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
      } // To be added in the future
    } /*else
      return data*/
  }

  /**
   * Gets an incoming message.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // Check if the function is called from a channel
   *  if (kit.isMessage()) {
   *    // Get text from an incoming message
   *    const message = kit.getIncomingMessage();
   *    console.log(message.text);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getIncomingMessage(): MessageObject | null {
    return this.isMessage() ? utils.clone((this.incomingMessage as MessageObject)) : null;
  }

  /**
   * Sets a reply message text.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // Check if the function is called from a channel
   *  if (kit.isMessage()) {
   *    // Get text from an incoming message
   *    const message = kit.getIncomingMessage();
   *    console.log(message.text);
   *    // Set text of the reply
   *    kit.setReplyMessageText('you wrote ' + message.text);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param text {string} - Reply text
   */
  public setReplyMessageText(text: string) {
    if (typeof text === "string") {
      this.replyMessage.text = text;
      return true;
    }

    return false;
  }

  /**
   * The function is called from a call.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (kit.isCall()) {
   *    console.log('This function is called from the call')
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public isCall(): boolean {
    return this.eventType === EVENT_TYPES.in_call_function;
  }

  /**
   * The function is called from a message.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (kit.isMessage()) {
   *    console.log('This function is called from the channel');
   *    const message = kit.getIncomingMessage();
   *    //...
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public isMessage(): boolean {
    return this.eventType === EVENT_TYPES.incoming_message;
  }

  /**
   * Gets a variable by name
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  const my_var = kit.getVariable('my_var');
   *  if (my_var) {
   *    console.log(my_var);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param name {string} - Variable name
   */
  public getVariable(name: string): string | null {
    return (typeof name === 'string' && typeof this.variables[name] !== "undefined") ? this.variables[name] : null
  }

  /**
   * Adds a variable or updates it if the variable name already exists.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  kit.setVariable('my_var', 'some_value');
   *  console.log(kit.getVariable('my_var'));
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param name {string} - Variable name
   * @param value {string} - Variable value to add or update
   */
  public setVariable(name: string, value: string): boolean {
    if (typeof name === 'string' && typeof value === 'string') {
      this.variables[name] = value;
      return true;
    }
    return false;
  }

  /**
   * Deletes a variable by name.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  kit.deleteVariable('my_var');
   *  // Console will print null
   *  console.log(kit.getVariable('my_var'));
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param name {string} - Variable name
   */
  deleteVariable(name: string) {
    if (typeof name === 'string') {
      delete this.variables[name];
    }
  }

  /**
   * Gets call headers.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (kit.isCall()) {
   *    const headers = kit.getCallHeaders();
   *    console.log(headers);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getCallHeaders(): ObjectType | null {
    return this.isCall() ? utils.clone(this.callHeaders) : null;
  }

  /**
   * Gets all call data.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (kit.isCall()) {
   *    const call = kit.getCallData();
   *    // Get the phone number from which the call is made
   *    console.log(call.phone_a);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getCallData(): CallObject | null {
    return this.isCall() ? utils.clone(this.call) : null;
  }

  /**
   * Gets all variables.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  const all_vars = kit.getVariables();
   *  console.log(all_vars);
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getVariables(): ObjectType {
    return utils.clone(this.variables);
  }

  /**
   * Gets all skills.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (this.isCall()) {
   *    const all_skills = kit.getSkills();
   *    console.log('All skills:', all_skills);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getSkills(): SkillObject[] {
    return utils.clone(this.skills);
  }

  /**
   * Adds a skill or updates it if the skill name already exists.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (this.isCall()) {
   *    kit.setSkill('some_skill_name', 5);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param name Skill name
   * @param level Proficiency level
   */
  public setSkill(name: string, level: number): boolean {
    if (typeof name !== 'string' || !Number.isInteger(level)) return false;

    if (level < 1 || level > 5) {
      console.warn('The level property must be a number from 1 to 5');
      return false;
    }

    const skillIndex = this.skills.findIndex(skill => {
      return skill.skill_name === name
    });

    if (skillIndex === -1) this.skills.push({
      "skill_name": name,
      "level": level
    })
    else this.skills[skillIndex].level = level;

    return true;
  }

  /**
   * Removes a skill by name.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (this.isCall()) {
   *    kit.removeSkill('some_skill_name');
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param name {string} - Name of the skill to remove
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

  /**
   * Sets the call priority. The higher the priority, the less time a client will wait for the operator's answer.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // Transfer a client to the queue
   *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
   *  // Set the highest priority
   *  kit.setPriority(10);
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param value {number} - Priority value, from 0 to 10
   */
  public setPriority(value: number): boolean {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10) {
      this.priority = value;
      return true;
    } else {
      console.warn(`The value ${ value } cannot be set as a priority. An integer from 0 to 10 is expected`);
      return false;
    }
  }

  /**
   * Gets call priorities.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // Return a number from 0 to 10
   *  const priority = kit.getPriority();
   *  if (priority === 10) {
   *    // Something to do
   *  } else if (priority === 5) {
   *    // Something to do
   *  } else {
   *    // Something to do
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getPriority(): number {
    return this.priority;
  }

  /**
   * Closes the client's request.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (this.isMessage()) {
   *    kit.finishRequest();
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
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
   * Reopens the client's request.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (this.isMessage()) {
   *    kit.finishRequest();
   *  }
   *  // ...
   *  // Сondition for reopening
   *  const shouldCancel = true;
   *  if (shouldCancel) {
   *    kit.cancelFinishRequest();
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
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
   * Transfers a client to the queue.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // Transfer a client to the queue
   *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param queue {QueueInfo} - Queue name or id
   */
  public transferToQueue(queue: QueueInfo) {
    if (!this.isMessage()) return false;

    if (typeof queue.queue_id === "undefined" || !Number.isInteger(queue.queue_id)) queue.queue_id = null;
    if (typeof queue.queue_name === "undefined" || typeof queue.queue_name !== "string") queue.queue_name = null;

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
   * Cancels transferring a client to the queue.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // Transfer a client to the queue
   *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
   *  //...
   *  // Condition for canceling the transfer to the queue
   *  const shouldCancel = true;
   *  if (shouldCancel) {
   *    kit.cancelTransferToQueue();
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
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
   * Gets a value from the database scope by key. Available only after loadDatabases() execution.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  try {
   *    // Connect available databases
   *    await kit.loadDatabases();
   *    // Get the value from the function scope by key
   *    const _test = kit.dbGet('test_key', 'function')
   *    console.log(_test);
   *  } catch(err) {
   *    console.log(err);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param key {string} - Key
   * @param scope {DataBaseType} - Database scope
   */
  public dbGet(key: string, scope: DataBaseType = "global"): string | null {
    return this.DB.getScopeValue(key, scope);
  }

  /**
   * Adds a value to the database scope or updates it if the key already exists. Available only after loadDatabases() execution.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  try {
   *    // Connect available databases
   *    await kit.loadDatabases();
   *    // Get a value from the function scope by key
   *    const _test = kit.dbGet('test_key', 'function')
   *    // If there is no data
   *    if (_test === null) {
   *      kit.dbSet('test_key', 'Hello world!!!', 'function');
   *    }
   *    // Write changes to the database
   *    kit.dbCommit()
   *  } catch(err) {
   *    console.log(err);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param key {string} - Key
   * @param value {any} - Value to add or update
   * @param scope {DataBaseType} - Database scope
   */
  public dbSet(key: string, value: any, scope: DataBaseType = "global"): boolean {
    return this.DB.setScopeValue(key, value, scope);
  }

  /**
   * Gets the whole database scope by name. Available only after loadDatabases() execution.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  try {
   *    // Connect available databases
   *    await kit.loadDatabases();
   *    // Read contents from the global scope
   *    const global_scope = kit.dbGetAll('global');
   *    console.log(global_scope)
   *  } catch(err) {
   *    console.log(err);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param scope {DataBaseType} - Database scope
   */
  public dbGetAll(scope: DataBaseType = "global"): ObjectType | null {
    return utils.clone(this.DB.getScopeAllValues(scope));
  }

  /**
   * Adds changes to the database. Available only after loadDatabases() execution.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  try {
   *    // Connect available databases
   *    await kit.loadDatabases();
   *    // Get a value from the function scope by key
   *    const _test = kit.dbGet('test_key', 'function')
   *    // If there is no data
   *    if (_test === null) {
   *      kit.dbSet('test_key', 'Hello world!!!', 'function');
   *    }
   *    // Write changes to the database
   *    kit.dbCommit()
   *  } catch(err) {
   *    console.log(err);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public async dbCommit() {
    const params: DateBasePutParams[] = [
      { name: 'function_' + this.functionId, scope: 'function' },
      { name: 'accountdb_' + this.domain, scope: 'global' },
    ]

    if (this.isMessage()) {
      params.push({ name: "conversation_" + this.incomingMessage.conversation.uuid, scope: 'conversation' })
    }

    try {
      return await this.DB.putAllDB(params);
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  /**
   * Allows you to use the Voximplant Kit API.
   * ```js
   * // Example of getting an account name
   *  const kit = new VoximplantKit(context);
   *  try {
   *     const { success, result } = await kit.apiProxy('/v2/account/getAccountInfo');
   *     if (success) {
   *        console.log('Account name', result.domain.name);
   *     }
   *  } catch (err) {
   *     console.log(err);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param url {string} - URL address
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
   * Adds a photo.
   * ```js
   * module.exports = async function(context, callback) {
   *  const kit = new VoximplantKit(context);
   *  kit.addPhoto('https://your-srite.com/img/some-photo.png');
   *  // End of function
   *  callback(200, kit.getResponseBody());
   *}
   * ```
   * @param url {String} - URL address of the photo
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
   * Gets a client’s SDK version.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  // Get a client’s SDK version
   *  kit.version();
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public version() {
    return "0.0.41"
  }
}

export = VoximplantKit;
