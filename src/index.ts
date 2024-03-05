import axios, {AxiosInstance} from 'axios'
import Api from "./Api"
import DB from "./DB"
import {
  CallObject,
  ContextObject,
  QueueInfo,
  SkillObject,
  MessageObject,
  ApiInstance,
  AvatarConfig,
  DataBaseType,
  RequestData,
  RequestObjectCallBody,
  ObjectType,
  DateBasePutParams,
  GetTagsResult,
  AvatarMessageObject,
  CallDataObject, ChannelDataObject, UserInfo, WebChatInlineButton,
} from "./types";
import Message from "./Message";
import utils from './utils';
import Avatar from "./Avatar";

utils.getEnv();


/**
 * @hidden
 */
const enum EVENT_TYPES {
  in_call_function = "in_call_function",
  incoming_message = "incoming_message",
  webhook = "webhook",
  avatar_function = 'avatar_function',
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
  private tags: number[];
  private isTagsReplace: boolean;
  private messageCustomData: { type: 'custom_data', name: string, data: string }[];
  private avatarReply!: AvatarMessageObject | null;
  public avatar: Avatar;


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
    this.messageCustomData = [];
    this.incomingMessage = new Message();
    this.replyMessage = new Message(true);
    this.http = axios

    if (typeof context === 'undefined' || !(context?.request && context.request.body && context.request.headers)) {
      const err = new TypeError('context parameter is required');
      err.stack = '';
      throw err;
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
    this.tags = this.getRequestDataTags();
    this.avatarReply = this.getRequestDataAvatar()

    this.api = new Api(this.domain, this.accessToken, this.apiUrl);
    this.DB = new DB(this.api);
    this.isTagsReplace = false;

    const avatarHeaders = {
      'x-kit-access-token': utils.getHeaderValue(context, 'x-kit-access-token', '') as string,
      'x-kit-api-url': utils.getHeaderValue(context, 'x-kit-api-url', '') as string,
      'x-kit-domain': utils.getHeaderValue(context, 'x-kit-domain', '') as string,
    };
    const avatarApiDomain = this.getEnvVariable('CUSTOM_AVATAR_API_DOMAIN') || this.getEnvVariable('KIT_AVATAR_API_DOMAIN');
    const kitImUrl = this.getEnvVariable('KIT_IM_URL');

    this.avatar = new Avatar(avatarApiDomain, kitImUrl, avatarHeaders);

    if (this.isMessage()) {
      this.incomingMessage = utils.clone(this.requestData) as MessageObject;
      this.replyMessage.type = (this.requestData as MessageObject).type;
      this.replyMessage.sender.is_bot = true;
      this.replyMessage.conversation = utils.clone((this.requestData as MessageObject).conversation);
    }

    if (this.isAvatar()) {
      const requestData = (this.requestData as AvatarMessageObject);
      this.replyMessage.text = requestData.response;
      this.avatar.setResponseData(requestData)
    }

    if (this.isMessage() || this.isAvatar()) {
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


  /**
   * Get the conversation uuid. Only applicable when called from a channel or when calling the function as a callbackUri in the sendMessageToAvatar method.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  if (kit.isMessage() || kit.isAvatar()) {
   *    const uuid = kit.getConversationUuid();
   *    //... do something
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getConversationUuid(): string | null {
    if (this.isMessage()) {
      let _messageObject = this.getIncomingMessage();
      return _messageObject && _messageObject.conversation ? _messageObject.conversation.uuid : null
    }

    if (this.isAvatar()) {
      return this.getRequestDataProperty('chat_id', null) || this.getRequestDataProperty('conversation_id', null);
    }

    return null;
  }

  /**
   * Get the function URI by its id.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  const uri = kit.getFunctionUriById(31);
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  getFunctionUriById(id: number): string | null {
    try {
      const urls = JSON.parse(this.getEnvVariable('KIT_FUNC_URLS'));
      if (id in urls) {
        return urls[id] as string;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  // TODO combine methods getRequestDataProperty/getRequestDataVariables/getRequestDataTags
  private getRequestDataProperty(name: string, defaultProp: unknown = {}) {
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

  private getRequestDataTags(): number[] {
    let tags = [];
    if (this.isMessage()) {
      tags = (this.requestData as MessageObject)?.conversation?.custom_data?.request_data?.tags || [];
    } else if (this.isCall()) {
      tags = (this.requestData as RequestObjectCallBody)?.TAGS || [];
    }
    return tags;
  }

  private getRequestDataAvatar(): AvatarMessageObject | null {
    const data = this.getRequestDataProperty('VOICE_AVATAR_REPLY', null);
    if (this.isCall() && data) {
      return {
        is_final: data.isFinal,
        response: data.utterance,
        custom_data: data.customData ?? null,
        current_state: data.currentState ?? null,
        next_state: data.nextState ?? null
      }
    }
    return null;
  }

  private findPayloadIndex(name: string, type = 'cmd'): number {
    return this.replyMessage.payload.findIndex(item => {
      return item.type === type && item.name === name;
    })
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
    const names = [
      'function_' + this.functionId,
      'accountdb_' + this.domain,
    ]

    if (this.isMessage()) {
      names.push('conversation_' + this.incomingMessage.conversation.uuid)
    }

    return await this.DB.getAllDB(names);
  }

  private _getVariables(): ObjectType {
    const variables: ObjectType = {};
    // Converting the type of variables to a string
    for (let key in this.variables) {
      if (this.variables.hasOwnProperty(key)) {
        try {
          variables[key] = typeof this.variables[key] === 'object' ? JSON.stringify(this.variables[key]) : this.variables[key] + '';
        } catch (e) {
          variables[key] = '';
        }
      }
    }
    return variables;
  }

  /**
   * Gets a message object.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  if (kit.isMessage() || kit.isAvatar()) {
   *    const messageObject = kit.getMessageObject();
   *    // ...do something
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getMessageObject(): ChannelDataObject | ObjectType {
    if (this.isMessage() || this.isAvatar()) {
      const variables = this._getVariables();
      const queuePayloadIndex = this.findPayloadIndex('transfer_to_queue');
      const tagsPayloadIndex = this.findPayloadIndex('bind_tags');

      if (this.messageCustomData.length) {
        this.replyMessage.payload = [...this.replyMessage.payload, ...this.messageCustomData]
      }

      if (queuePayloadIndex !== -1) {
        this.replyMessage.payload[queuePayloadIndex].skills = this.skills;
        this.replyMessage.payload[queuePayloadIndex].priority = this.priority;
      }

      if (tagsPayloadIndex !== -1) {
        const tagsPayload = this.replyMessage.payload[tagsPayloadIndex];
        tagsPayload.tags = Array.from(new Set(this.tags));
        tagsPayload.replace = this.isTagsReplace;
      }

      return {
        text: this.replyMessage.text,
        payload: utils.clone(this.replyMessage.payload),
        variables: variables
      }
    } else {
      return {}
    }
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
  public getResponseBody(): CallDataObject | ChannelDataObject | undefined {
    const variables: ObjectType = this._getVariables();

    if (this.isCall()) {
      return {
        "VARIABLES": variables,
        "SKILLS": this.skills,
        "TAGS": Array.from(new Set(this.tags))
      }
    } else if (this.isMessage()) {
      return this.getMessageObject() as ChannelDataObject;
    } else {
      return;
    }
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
   * The function is called by the avatar.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (kit.isAvatar()) {
   *    //...do something
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public isAvatar(): boolean {
    return this.eventType === EVENT_TYPES.avatar_function;
  }

  /**
   * Gets a variable by name.
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
   * @param value {any} - Variable value
   */
  public setVariable(name: string, value: any): boolean {
    if (typeof name === 'string') {
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
  deleteVariable(name: string): boolean {
    if (typeof name === 'string' && name in this.variables) {
      delete this.variables[name];
      return true;
    }
    return false;
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
   * Adds a skill or updates it if the skill id already exists.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (kit.isCall()) {
   *    kit.setSkill({skill_id: 234, level: 5});
   *  } else if (kit.isMessage()) {
   *    kit.setSkill({skill_id: 35, level: 3});
   *    kit.transferToQueue({queue_id: 72});
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public setSkill(skill: SkillObject): boolean {
    if (!('skill_id' in skill)) {
      console.warn('setSkill: The id parameter is required');
      return false;
    }

    if (!('level' in skill)) {
      console.warn('setSkill: The level parameter is required');
      return false;
    }

    if (!Number.isInteger(skill.skill_id) || !Number.isInteger(skill.level)) return false;

    if (skill.skill_id < 0) {
      console.warn('setSkill: The skill_id parameter must be a positive integer');
      return false;
    }

    if (skill.level < 1 || skill.level > 5) {
      console.warn('setSkill: The level parameter must be an integer from 1 to 5');
      return false;
    }

    const skillIndex = this.skills.findIndex(item => {
      return item.skill_id === skill.skill_id
    });

    if (skillIndex === -1) this.skills.push({
      "skill_id": skill.skill_id,
      "level": skill.level
    })
    else this.skills[skillIndex].level = skill.level;
    return true;
  }

  /**
   * Removes a skill by id.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  kit.removeSkill(234);
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param id {Number} - Name of the skill to remove
   */
  public removeSkill(id: number): boolean {
    const skillIndex = this.skills.findIndex(skill => {
      return skill.skill_id === id
    })
    if (skillIndex > -1) {
      this.skills.splice(skillIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * Sets the call priority. The higher the priority, the less time a client will wait for the operator's response.
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
      console.warn(`${value} cannot be set as a priority value. An integer from 0 to 10 is expected`);
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
    if (!(this.isMessage() || this.isAvatar())) return false
    const payloadIndex = this.findPayloadIndex('finish_request');

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
    const payloadIndex = this.findPayloadIndex('finish_request')

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
   *  kit.transferToQueue({queue_id: 82});
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public transferToQueue(queue: QueueInfo) {
    if (!(this.isMessage() || this.isAvatar())) return false;

    this.cancelTransferToUser();

    if (typeof queue.queue_id === "undefined" || !Number.isInteger(queue.queue_id)) queue.queue_id = null;
    if (typeof queue.queue_name === "undefined" || typeof queue.queue_name !== "string") queue.queue_name = null;

    if (queue.queue_id === null && queue.queue_name === null) return false

    const payloadIndex = this.findPayloadIndex('transfer_to_queue');

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
   * Transfers a client to the user. Only for text channels and Avatar.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  if (this.isMessage() || this.isAvatar()) {
   *    // Use user_id or user_email.
   *    kit.transferToUser({user_id: 12});
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public transferToUser(user: UserInfo): boolean {
    if (!(this.isMessage() || this.isAvatar())) return false;

    this.cancelTransferToQueue();

    if (typeof user.user_id === "undefined" || !Number.isInteger(user.user_id)) user.user_id = null;
    if (typeof user.user_email === "undefined" || typeof user.user_email !== "string") user.user_email = null;

    if (user.user_id === null && user.user_email === null) return false

    const payloadIndex = this.findPayloadIndex('transfer_to_user');

    if (payloadIndex > -1) {
      this.replyMessage.payload[payloadIndex].user = user
    } else {
      this.replyMessage.payload.push({
        type: "cmd",
        name: "transfer_to_user",
        user: user
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
    const payloadIndex = this.findPayloadIndex('transfer_to_queue');

    if (payloadIndex > -1) {
      this.replyMessage.payload.splice(payloadIndex, 1)
    }

    return true
  }

  /**
   * Cancels transferring a client to the user.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  // Transfer a client to the queue
   *  kit.transferToUser({user_id: 12});
   *  //...
   *  // Condition for canceling the transfer to the queue
   *  const shouldCancel = true;
   *  if (shouldCancel) {
   *    kit.cancelTransferToUser();
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public cancelTransferToUser() {
    const payloadIndex = this.findPayloadIndex('transfer_to_user');

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
   *    await kit.dbCommit();
   *  } catch(err) {
   *    console.log(err);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param key {string} - Key
   * @param value {any} - Value
   * @param scope {DataBaseType} - Database scope
   */
  public dbSet(key: string, value: any, scope: DataBaseType = "global"): boolean {
    return this.DB.setScopeValue(key, value, scope);
  }

  /**
   * Deletes a value from the database scope, if the key already exists. Available only after laodDatabase(). execution.
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  try {
   *    // Connect available databases
   *    await kit.loadDatabases();
   *    // Delete a value from the function scope by key
   *    kit.dbDelete('test_key', 'function')
   *    // Write changes to the database
   *   await kit.dbCommit();
   *  } catch(err) {
   *    console.log(err);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param key {string} - Key
   * @param scope {DataBaseType} - Database scope
   */
  public dbDelete(key: string, scope: DataBaseType): boolean {
    return this.DB.deleteScopeValue(key, scope);
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
   *    await kit.dbCommit();
   *  } catch(err) {
   *    console.log(err);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public async dbCommit(): Promise<boolean> {
    const params: DateBasePutParams[] = [
      {name: 'function_' + this.functionId, scope: 'function'},
      {name: 'accountdb_' + this.domain, scope: 'global'},
    ]

    if (this.isMessage()) {
      params.push({name: "conversation_" + this.incomingMessage.conversation.uuid, scope: 'conversation'})
    }

    try {
      return await this.DB.putAllDB(params);
    } catch (err) {
      if (err && 'response' in err) {
        console.log('dbCommit error', err.response?.data);
      } else {
        console.log('dbCommit error', err);
      }
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
      if (err && 'response' in err) {
        return Promise.reject(err.response?.data);
      }
      return Promise.reject(err);
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
    });

    return true;
  }

  /**
   * Gets an environment variable by name.
   * [More details here.](https://voximplant.com/kit/docs/functions/envvariables)
   * ```js
   *  // Initialize a VoximplantKit instance
   *  const kit = new VoximplantKit(context);
   *  const my_var = kit.getEnvVariable('myEnv');
   *  if (my_var) {
   *    console.log(my_var);
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param name {string} - Variable name
   */
  public getEnvVariable(name: string): string | null {
    return utils.getEnvVariable(name);
  }

  /**
   * A static method used outside the function body that gets environment variables.
   * ```js
   *  const my_var = VoximplantKit.getEnvironmentVariable('myEnv');
   *  if (my_var) {
   *    console.log(my_var);
   *  }
   * ```
   * @static
   */
  static getEnvironmentVariable(name: string): string | null {
    if (typeof name === 'string') {
      return name in process.env ? process.env[name] : null;
    } else {
      return null;
    }
  }

  /**
   * @hidden
   */
  validateWebChatInlineButton(button: WebChatInlineButton): boolean {
    const supportTypes = ['text']
    if (!button.type || typeof button.type !== 'string' || !supportTypes.includes(button.type)) {
      console.error('Invalid field type:', button)
      return false
    }

    if (!button.text || typeof button.text !== 'string' || button.text.length > 40) {
      console.error('Invalid field text:', button)
      return false
    }

    if (button.data && typeof button.data !== 'string') {
      console.error('Invalid field data:', button)
      return false;
    }

    return true;
  }

  /**
   * Adds buttons for the web chat channel
   * ```js
   *  const kit = new VoximplantKit(context);
   *  if (kit.isMessage() || kit.isAvatar()) {
   *    // Text is required for each button and must not be greater than 40 char.
   *    // The max number of buttons is 13.
   *    const buttons = [
   *      {type: 'text', text: 'Some btn text', data: 'Some btn data'}
   *      {type: 'text', text: 'Another btn text', data: JSON.stringify({name: 'Jon Doe', age: 30})}
   *    ]
   *    kit.setReplyWebChatInlineButtons(buttons);
   *  }
   *
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public setReplyWebChatInlineButtons(buttons: WebChatInlineButton[]): boolean {
    if (!(this.isAvatar() || this.isMessage())) {
      console.error('The setReplyWebChatInlineButtons method is only available for channels and Avatar response');
      return false;
    }

    if (!Array.isArray(buttons)) {
      console.error('The buttons argument must be an array');
      return false;
    }

    if (buttons.length > 13) {
      console.error('The number of buttons should not be greater than 13');
      return false;
    }
    const payloadIndex = this.findPayloadIndex(undefined, 'webchat_inline_buttons');
    const isValid = buttons.every(button => this.validateWebChatInlineButton(button))
    if (!isValid) return false;

    const needClearPayload = buttons.length === 0;
    if (needClearPayload) {
      console.log('needClearPayload', needClearPayload, payloadIndex)
      payloadIndex !== -1 ? this.replyMessage.payload.splice(payloadIndex, 1) : null;
      return true;
    }

    const payload = {
      type: "webchat_inline_buttons",
      buttons
    }

    if (payloadIndex !== -1) {
      this.replyMessage.payload[payloadIndex] = payload
    } else {
      this.replyMessage.payload.push(payload)
    }

    return true;
  }

  private setTags(tags: number[], replace = false): boolean {
    if (Array.isArray(tags)) {
      const payloadIndex = this.findPayloadIndex('bind_tags');
      const onlyPositiveInt = tags.filter(tag => Number.isInteger(tag) && tag >= 0);
      const type = replace ? 'replaceTags:' : 'addTags:';

      if (!replace && !onlyPositiveInt.length) {
        console.warn(type, 'The tags argument must be an array containing only positive integers');
        return false;
      }

      if (replace && tags.length && !onlyPositiveInt.length) {
        console.warn(type, 'The tags argument must be an array containing only positive integers');
      }

      this.tags = replace ? onlyPositiveInt : this.tags.concat(onlyPositiveInt);
      this.tags = Array.from(new Set(this.tags)) // only unique ids;
      this.isTagsReplace = replace;

      if (payloadIndex === -1) {
        this.replyMessage.payload.push({
          type: "cmd",
          name: "bind_tags",
        })
      }
      return true;
    } else {
      console.warn('The array must contain only integers greater than zero');
      return false;
    }
  }

  /**
   * Adds tags by id.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  kit.addTags([12, 34]);
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  addTags(tags: number[]): boolean {
    return this.setTags(tags)
  }

  /**
   * Replaces all tags.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  kit.replaceTags([12, 34]);
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  replaceTags(tags: number[]): boolean {
    return this.setTags(tags, true);
  }

  /**
   * Gets tags.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  await kit.getTags(); // [12, 34]
   *  await kit.getTags(true); // [{id: 12, tag_name: 'my_tag'}, {id: 34, tag_name: 'my_tag2'}]
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   * @param withName {Boolean} - If the argument is true, it returns the array with the id and tag names. Otherwise, it will return the array with the id tags
   */
  getTags(withName?: boolean): Promise<number[]> | Promise<GetTagsResult[]> {
    const tags = utils.clone(this.tags);

    if (!withName) return Promise.resolve(tags);

    return this.apiProxy('/v3/tags/searchTags', {'per-page': 0})
      .then(({result}) => {
        return tags.map(tag => {
          const fullTag = result.find(item => item.id === tag);
          if (fullTag) return {id: tag, tag_name: fullTag.tag_name};
          else {
            return {id: tag, tag_name: null}
          }
        })
      }) as Promise<GetTagsResult[]>;
  }

  /**
   * Set custom data.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  kit.setCustomData('my_data', {a: 1, b 'some text'}); // [12, 34]
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  setCustomData(name: string, data: unknown): boolean {
    if (typeof name !== 'string' || !name?.length) {
      console.error('The name parameter must be a string');
      return false;
    }

    if (typeof data === 'undefined') {
      console.error('Missing the required parameter data');
      return false;
    }

    const payloadIndex = this.messageCustomData.findIndex(item => item.name === name);
    try {
      const customData = JSON.stringify(data);
      if (payloadIndex > -1) {
        this.messageCustomData[payloadIndex] = {type: "custom_data", name, data: customData}
      } else {
        this.messageCustomData = this.messageCustomData.concat({type: "custom_data", name, data: customData});
      }
      return true;
    } catch (err) {
      console.error('Failed to serialize data passed to the data parameter');
      return false;
    }
  }

  /**
   * Delete custom data.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  kit.deleteCustomData('my_data');
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  deleteCustomData(name: string): boolean {
    if (typeof name !== 'string' || !name?.length) {
      console.error('The name parameter must be a string');
      return false;
    }
    const payloadIndex = this.messageCustomData.findIndex(item => item.name === name);

    if (payloadIndex > -1) {
      this.messageCustomData.splice(payloadIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * Get DialogFlow key by id.
   * ```js
   *  const kit = new VoximplantKit(context);
   *  const dfKey = kit.getDfKey(15);
   *  if (dfKey) {
   *    console.log('My DF key:', dfKey);
   *    //... do something
   *  }
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getDfKey(id: number): ObjectType | null {
    return utils.getDfKey(id);
  }

  /**
   * Gets a list of available DialogFlow keys
   * ```js
   *  const kit = new VoximplantKit(context);
   *  const dfKeyList = kit.getDfKeysList();
   *  console.log('My DF keys:', dfKeyList);
   *  //... do something
   *
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getDfKeysList(): string[] {
    return utils.getDfKeysList();
  }

  /**
   * Gets an avatar reply
   * ```js
   *  const kit = new VoximplantKit(context);
   *  if (kit.isCall()) {
   *   const reply = kit.getAvatarReply();
   *   console.log('Reply: ', reply);
   *  }
   *
   *  // End of function
   *  callback(200, kit.getResponseBody());
   * ```
   */
  public getAvatarReply(): AvatarMessageObject | null {
    return utils.clone(this.avatarReply) || null;
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
    return utils.getVersion();
  }
}

export = VoximplantKit;
