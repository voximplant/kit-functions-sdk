import axios, {AxiosInstance} from 'axios'
import Api from "./Api"
import DB from "./DB"
import {
  ApiInstance,
  AvatarMessageObject,
  CallDataObject,
  CallObject,
  ChannelDataObject,
  ContextObject,
  DataBaseType,
  DateBasePutParams,
  GetTagsResult,
  IncomingMessageObject,
  MessageObject,
  MessagePayloadItem,
  ObjectType,
  PayloadContact,
  PayloadLocation,
  QueueInfo,
  RequestData,
  RequestObjectCallBody,
  SkillObject,
  TelegramInlineKeyboardButton,
  TelegramReplyKeyboardButton,
  TelegramReplyKeyboardParams,
  TelegramReplyKeyboardRemove,
  UserInfo,
  ValidateSchema,
  WebChatInlineButton,
  WhatsappEdnaKeyboardRow,
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
  private sessionAccessUrl: string = '';
  private xFissionFunctionName: string = '';
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
  private incomingMessage: IncomingMessageObject;
  private tags: number[];
  private isTagsReplace: boolean;
  private messageCustomData: { type: 'custom_data', name: string, data: string }[];
  private avatarReply!: AvatarMessageObject | null;
  public avatar: Avatar;


  /**
   * Voximplant Kit class, a middleware for working with functions.
   * @exampleFile index/constructor.md
   */
  constructor(context: ContextObject) {
    this.messageCustomData = [];
    this.incomingMessage = new Message() as IncomingMessageObject;
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
    this.xFissionFunctionName = utils.getHeaderValue(context, 'x-fission-function-name', '') as string
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
      this.incomingMessage = utils.clone(this.requestData) as IncomingMessageObject;
      this.incomingMessage.button_data = this.getIncomingMessageButtonData();
      this.incomingMessage.contacts = this.incomingMessage.payload.filter(payload => payload.type === 'contact') as unknown as PayloadContact[];
      this.incomingMessage.locations = this.incomingMessage.payload.filter(payload => payload.type === 'location') as unknown as PayloadLocation[];

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
   * @hidden
   */
  private getIncomingMessageButtonData(): string | null {
    if (this.isMessage()) {
      const payload = (this.requestData as MessageObject).payload;
      const payloadIdx = payload.findIndex(item => item.type === 'button_data');
      if (payloadIdx !== -1) {
        return payload[payloadIdx]?.data ?? null;
      }
      return null;
    }
    return null;
  }

  /**
   * Get the conversation uuid. Only applicable when called from a channel or when calling the function as a callbackUri in the sendMessageToAvatar method.
   * @exampleFile index/getConversationUuid.md
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
   * @exampleFile index/getFunctionUriById.md
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

  /**
   * Get the URL of the current function. Used for invoking the function as a callback.
   * @exampleFile index/getCurrentFunctionUri.md
   */
  getCurrentFunctionUri(): string | null {
    try {
      const urls = JSON.parse(this.getEnvVariable('KIT_FUNC_URLS')) as Record<string, string>;
      console.log(this.getEnvVariable('KIT_FUNC_URLS'));
      return Object.values(urls || {}).find(urlValue => urlValue.includes(this.xFissionFunctionName)) ?? null;
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
   * @exampleFile index/loadDatabases.md
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
   * @exampleFile index/getMessageObject.md
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
   * @exampleFile index/getResponseBody.md
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
   * @exampleFile index/getIncomingMessage.md
   */
  public getIncomingMessage(): IncomingMessageObject | null {
    return this.isMessage() ? utils.clone((this.incomingMessage)) : null;
  }

  /**
   * Sets a reply message text.
   * @exampleFile index/setReplyMessageText.md
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
   * @exampleFile index/isCall.md
   */
  public isCall(): boolean {
    return this.eventType === EVENT_TYPES.in_call_function;
  }

  /**
   * The function is called from a message.
   * @exampleFile index/isMessage.md
   */
  public isMessage(): boolean {
    return this.eventType === EVENT_TYPES.incoming_message;
  }


  /**
   * The function is called by the avatar.
   * @exampleFile index/isAvatar.md
   */
  public isAvatar(): boolean {
    return this.eventType === EVENT_TYPES.avatar_function;
  }

  /**
   * Gets a variable by name.
   * @exampleFile index/getVariable.md
   * @param name {string} - Variable name
   */
  public getVariable(name: string): string | null {
    return (typeof name === 'string' && typeof this.variables[name] !== "undefined") ? this.variables[name] : null
  }

  /**
   * Adds a variable or updates it if the variable name already exists.
   * @exampleFile index/setVariable.md
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
   * @exampleFile index/deleteVariable.md
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
   * @exampleFile index/getCallHeaders.md
   */
  public getCallHeaders(): ObjectType | null {
    return this.isCall() ? utils.clone(this.callHeaders) : null;
  }

  /**
   * Gets all call data.
   * @exampleFile index/getCallData.md
   */
  public getCallData(): CallObject | null {
    return this.isCall() ? utils.clone(this.call) : null;
  }

  /**
   * Gets all variables.
   * @exampleFile index/getVariables.md
   */
  public getVariables(): ObjectType {
    return utils.clone(this.variables);
  }

  /**
   * Gets all skills.
   * @exampleFile index/getSkills.md
   */
  public getSkills(): SkillObject[] {
    return utils.clone(this.skills);
  }

  /**
   * Adds a skill or updates it if the skill id already exists.
   * @exampleFile index/setSkill.md
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
   * @exampleFile index/removeSkill.md
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
   * @exampleFile index/setPriority.md
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
   * @exampleFile index/getPriority.md
   */
  public getPriority(): number {
    return this.priority;
  }

  /**
   * Closes the client's request.
   * @exampleFile index/finishRequest.md
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
   * @exampleFile index/cancelFinishRequest.md
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
   * @exampleFile index/transferToQueue.md
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
   * @exampleFile index/transferToUser.md
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
   * @exampleFile index/cancelTransferToQueue.md
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
   * @exampleFile index/cancelTransferToUser.md
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
   * @exampleFile index/dbGet.md
   * @param key {string} - Key
   * @param scope {DataBaseType} - Database scope
   */
  public dbGet(key: string, scope: DataBaseType = "global"): string | null {
    return this.DB.getScopeValue(key, scope);
  }

  /**
   * Adds a value to the database scope or updates it if the key already exists. Available only after loadDatabases() execution.
   * @exampleFile index/dbSet.md
   * @param key {string} - Key
   * @param value {any} - Value
   * @param scope {DataBaseType} - Database scope
   */
  public dbSet(key: string, value: any, scope: DataBaseType = "global"): boolean {
    return this.DB.setScopeValue(key, value, scope);
  }

  /**
   * Deletes a value from the specified database scope, if the key already exists. Available only after loadDatabase() execution.
   * @exampleFile index/dbDelete.md
   * @param key {string} - Key
   * @param scope {DataBaseType} - Database scope
   */
  public dbDelete(key: string, scope: DataBaseType): boolean {
    return this.DB.deleteScopeValue(key, scope);
  }

  /**
   * Gets the whole database scope by name. Available only after loadDatabases() execution.
   * @exampleFile index/dbGetAll.md
   * @param scope {DataBaseType} - Database scope
   */
  public dbGetAll(scope: DataBaseType = "global"): ObjectType | null {
    return utils.clone(this.DB.getScopeAllValues(scope));
  }

  /**
   * Adds changes to the database. Available only after loadDatabases() execution.
   * @exampleFile index/dbCommit.md
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
   * @exampleFile index/apiProxy.md
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
   * @exampleFile index/addPhoto.md
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
   * @exampleFile index/getEnvVariable.md
   * @param name {string} - Variable name
   */
  public getEnvVariable(name: string): string | null {
    return utils.getEnvVariable(name);
  }

  /**
   * A static method used outside the function body that gets environment variables.
   * @exampleFile index/getEnvironmentVariable.md
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
  private validateWebChatInlineButton(button: WebChatInlineButton): boolean {
    const supportTypes = ['text']
    if (!button.type || typeof button.type !== 'string' || !supportTypes.includes(button.type)) {
      console.error('Invalid field type:', button)
      return false
    }

    if (!button.text || typeof button.text !== 'string' || button.text.length > 40) {
      console.error('Invalid field text:', button)
      return false
    }

    if ('data' in button && typeof button.data !== 'string') {
      console.error('Invalid field data:', button)
      return false;
    }

    return true;
  }

  private validateObject(object: Record<string, any>, schema: ValidateSchema, label = ''): boolean {
    for (const key in schema) {
      const rule = schema[key];
      const value = object[key];

      const errorLabel = label ? `${label}: ` : ''

      if (rule.required && value === undefined) {
        console.error(`${errorLabel}Field '${key}' is required but missing.`);
        return false;
      }

      if (value !== undefined) {
        if (typeof value !== rule.type) {
          console.error(`${errorLabel}Field '${key}' should be of type '${rule.type}' but got '${typeof value}'.`);
          return false;
        }

        if (rule.value && !rule.value.includes(value)) {
          console.error(`${errorLabel}Field '${key}' has an invalid value '${value}'. Expected one of ${JSON.stringify(rule.value)}.`);
          return false;
        }
      }
    }

    return true;
  }

  private validateTelegramReplyKeyboardParams(params: TelegramReplyKeyboardParams): boolean {
    if (!utils.isObject(params)) {
      console.error('The keyboard_params argument must be an object');
      return false;
    }

    const telegramReplyKeyboardParamsSchema = {
      is_persistent: {required: false, type: 'boolean'},
      resize_keyboard: {required: false, type: 'boolean'},
      one_time_keyboard: {required: false, type: 'boolean'},
      input_field_placeholder: {required: false, type: 'string'},
      selective: {required: false, type: 'boolean'},
    }

    return this.validateObject(params, telegramReplyKeyboardParamsSchema, 'telegramReplyKeyboardParams')
  }

  /**
   * Adds buttons for the web chat channel
   * @exampleFile index/setReplyWebChatInlineButtons.md
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
      payloadIndex !== -1 ? this.replyMessage.payload.splice(payloadIndex, 1) : null;
      return true;
    }

    const payload = {
      type: "webchat_inline_buttons",
      buttons
    }

    this.setPayloadByIndex(payloadIndex, payload);

    return true;
  }

  /**
   * Adds inline keyboard for the telegram channel
   * @exampleFile index/setTelegramInlineKeyboard.md
   */
  setTelegramInlineKeyboard(keyboard_markup: TelegramInlineKeyboardButton[][]): boolean {
    if (!(this.isAvatar() || this.isMessage())) {
      console.error('The setTelegramInlineKeyboard method is only available for channels and Avatar response');
      return false;
    }

    if (!Array.isArray(keyboard_markup)) {
      console.error('The keyboard_markup argument must be an array');
      return false;
    }

    const isValid = keyboard_markup.every((keyboard, idx) => {
      if (!Array.isArray(keyboard)) {
        console.error(`The keyboard at the ${idx} index must be an array`);
        return false;
      }
      return keyboard.every(button => this.validateTelegramInlineKeyboardButton(button))
    })
    if (!isValid) return false;

    const payloadIndex = this.findPayloadIndex(undefined, 'telegram_inline_keyboard_markup');
    const needClearPayload = keyboard_markup.length === 0;

    if (needClearPayload) {
      payloadIndex > -1 ? this.replyMessage.payload.splice(payloadIndex, 1) : null;
      return true;
    }

    const payload = {
      type: "telegram_inline_keyboard_markup",
      inline_keyboard_markup: keyboard_markup
    };

    this.setPayloadByIndex(payloadIndex, payload);
    return true;
  }

  private validateTelegramInlineKeyboardButton(button: TelegramInlineKeyboardButton): boolean {
    const telegramInlineKeyboardSchema = {
      text: {required: true, type: 'string'},
      url: {required: false, type: 'string'},
      callback_data: {required: false, type: 'string'},
    }
    const isValid = this.validateObject(button, telegramInlineKeyboardSchema);
    const hasOneOfOptionalField = button.url || button.callback_data;

    if (!hasOneOfOptionalField) {
      console.error('For the InlineKeyboardButton, you must use one of the optional url or callback_data fields')
      return false;
    }
    return !!(isValid && hasOneOfOptionalField);
  }

  /**
   * Adds reply keyboard for the telegram channel
   * @exampleFile index/setTelegramReplyKeyboard.md
   */
  setTelegramReplyKeyboard(keyboard_markup: TelegramReplyKeyboardButton[][], keyboard_params: TelegramReplyKeyboardParams = {}): boolean {
    if (!(this.isAvatar() || this.isMessage())) {
      console.error('The setTelegramReplyKeyboard method is only available for channels and Avatar response');
      return false;
    }

    if (!Array.isArray(keyboard_markup)) {
      console.error('The keyboard_markup argument must be an array');
      return false;
    }

    const telegramReplyKeyboardSchema = {
      text: {required: true, type: 'string'},
      request_contact: {required: false, type: 'boolean'},
      request_location: {required: false, type: 'boolean'}
    }

    const isValid = keyboard_markup.every((keyboard, idx) => {
      if (!Array.isArray(keyboard)) {
        console.error(`The keyboard at the ${idx} index must be an array`);
        return false;
      }
      return keyboard.every(button => this.validateObject(button, telegramReplyKeyboardSchema))
    })

    const isValidParams = this.validateTelegramReplyKeyboardParams(keyboard_params);

    if (!isValid || !isValidParams) return false;

    const payloadIndex = this.findPayloadIndex(undefined, 'telegram_reply_keyboard_markup');
    const needClearPayload = keyboard_markup.length === 0;

    if (needClearPayload) {
      payloadIndex > -1 ? this.replyMessage.payload.splice(payloadIndex, 1) : null;
      return true;
    }

    const payload = {
      type: "telegram_reply_keyboard_markup",
      reply_keyboard_params: keyboard_params,
      reply_keyboard_markup: keyboard_markup
    };

    this.setPayloadByIndex(payloadIndex, payload);

    return true;
  }

  /**
   * Remove replyKeyboard for telegram channel
   * @exampleFile index/setTelegramReplyKeyboardRemove.md
   */
  setTelegramReplyKeyboardRemove(remove_params: TelegramReplyKeyboardRemove): boolean {
    const payloadIndex = this.findPayloadIndex(undefined, 'telegram_reply_keyboard_remove');
    const needClearPayload = Object.keys(remove_params).length === 0;

    if (!(this.isAvatar() || this.isMessage())) {
      console.error('The setTelegramReplyKeyboardRemove method is only available for channels and Avatar response');
      return false;
    }

    const telegramReplyKeyboardRemoveSchema = {
      remove_keyboard: {required: true, type: 'boolean'},
      selective: {required: false, type: 'boolean'},
    }

    if (!remove_params || !utils.isObject(remove_params)) {
      console.error('The remove_params argument must be an object');
      return false;
    }

    const isValid = this.validateObject(remove_params, telegramReplyKeyboardRemoveSchema)

    if (!isValid && !needClearPayload) return false;

    if (needClearPayload) {
      payloadIndex > -1 ? this.replyMessage.payload.splice(payloadIndex, 1) : null;
      return true;
    }

    const payload = {
      type: "telegram_reply_keyboard_remove",
      reply_keyboard_remove_params: remove_params
    }

    this.setPayloadByIndex(payloadIndex, payload);

    return true;
  }

  private setPayloadByIndex(index: number, payload: MessagePayloadItem) {
    if (index !== -1) {
      this.replyMessage.payload[index] = payload
    } else {
      this.replyMessage.payload.push(payload)
    }

    return true;
  }

  /**
   * Set Whatsapp Edna keyboard
   * @exampleFile index/setWhatsappEdnaKeyboard.md
   */
  public setWhatsappEdnaKeyboard(keyboard_rows: WhatsappEdnaKeyboardRow[]): boolean {
    if (!(this.isAvatar() || this.isMessage())) {
      console.error('The setWhatsappEdnaKeyboard method is only available for channels and Avatar response');
      return false;
    }

    if (!Array.isArray(keyboard_rows)) {
      console.error('The keyboard_rows argument must be an array');
      return false;
    }

    const payloadIndex = this.findPayloadIndex(undefined, 'whatsapp_edna_keyboard');

    const whatsappEdnaKeyboardButtonsSchema = {
      text: {required: true, type: 'string',},
      type: {required: true, type: 'string', value: [/*'URL', 'PHONE', */'QUICK_REPLY']},
      url: {required: false, type: 'string'},
      urlPostfix: {required: false, type: 'string'},
      payload: {required: false, type: 'string'},
      phone: {required: false, type: 'string'},
    }

    const isValid = keyboard_rows.every(row => {
      const isValidRow = Array.isArray(row.buttons);
      if (!isValidRow) {
        console.error('The buttons field from the keyboard_rows argument must be of the Array type');
        return false;
      }
      return row.buttons.every(button => this.validateObject(button, whatsappEdnaKeyboardButtonsSchema));
    });

    if (!isValid) return false;

    const needClearPayload = keyboard_rows.length === 0;
    if (needClearPayload) {
      payloadIndex !== -1 ? this.replyMessage.payload.splice(payloadIndex, 1) : null;
      return true;
    }

    const payload = {
      type: "whatsapp_edna_keyboard",
      whatsapp_edna_keyboard_rows: keyboard_rows
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
   * This method allows you to add tags to the current context.
   *
   * @exampleFile index/addTags.md
   */
  addTags(tags: number[]): boolean {
    return this.setTags(tags)
  }

  /**
   * Replaces all tags.
   * @exampleFile index/replaceTags.md
   */
  replaceTags(tags: number[]): boolean {
    return this.setTags(tags, true);
  }

  /**
   * Gets tags.
   * @exampleFile index/getTags.md
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
   * @exampleFile index/setCustomData.md
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
   * @exampleFile index/deleteCustomData.md
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
   * @exampleFile index/getDfKey.md
   */
  public getDfKey(id: number): ObjectType | null {
    return utils.getDfKey(id);
  }

  /**
   * Gets a list of available DialogFlow keys
   * @exampleFile index/getDfKeysList.md
   */
  public getDfKeysList(): string[] {
    return utils.getDfKeysList();
  }

  /**
   * Gets an avatar reply
   * @exampleFile index/getAvatarReply.md
   */
  public getAvatarReply(): AvatarMessageObject | null {
    return utils.clone(this.avatarReply) || null;
  }

  /**
   * Gets a client’s SDK version.
   * @exampleFile index/version.md
   */
  public version() {
    return utils.getVersion();
  }
}

export = VoximplantKit;
