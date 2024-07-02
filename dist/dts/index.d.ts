import { CallObject, ContextObject, QueueInfo, SkillObject, MessageObject, DataBaseType, ObjectType, GetTagsResult, AvatarMessageObject, CallDataObject, ChannelDataObject, UserInfo, WebChatInlineButton, WhatsappEdnaKeyboardButton } from "./types";
import Avatar from "./Avatar";
declare class VoximplantKit {
    private requestData;
    private accessToken;
    private sessionAccessUrl;
    private apiUrl;
    private domain;
    private functionId;
    private DB;
    private priority;
    private http;
    private api;
    private callHeaders;
    private variables;
    private call;
    private skills;
    private eventType;
    private replyMessage;
    private incomingMessage;
    private tags;
    private isTagsReplace;
    private messageCustomData;
    private avatarReply;
    avatar: Avatar;
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
    constructor(context: ContextObject);
    /**
     * @hidden
     */
    static default: typeof VoximplantKit;
    /**
     * @hidden
     */
    private getIncomingMessageButtonData;
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
    getConversationUuid(): string | null;
    /**
     * Get the function URI by its id.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  const uri = kit.getFunctionUriById(31);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getFunctionUriById(id: number): string | null;
    private getRequestDataProperty;
    private getRequestDataVariables;
    private getRequestDataTags;
    private getRequestDataAvatar;
    private findPayloadIndex;
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
    loadDatabases(): Promise<void>;
    private _getVariables;
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
    getMessageObject(): ChannelDataObject | ObjectType;
    /**
     * Gets a function response. Needs to be called at the end of each function.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getResponseBody(): CallDataObject | ChannelDataObject | undefined;
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
    getIncomingMessage(): MessageObject | null;
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
    setReplyMessageText(text: string): boolean;
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
    isCall(): boolean;
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
    isMessage(): boolean;
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
    isAvatar(): boolean;
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
    getVariable(name: string): string | null;
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
    setVariable(name: string, value: any): boolean;
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
    deleteVariable(name: string): boolean;
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
    getCallHeaders(): ObjectType | null;
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
    getCallData(): CallObject | null;
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
    getVariables(): ObjectType;
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
    getSkills(): SkillObject[];
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
    setSkill(skill: SkillObject): boolean;
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
    removeSkill(id: number): boolean;
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
    setPriority(value: number): boolean;
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
    getPriority(): number;
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
    finishRequest(): boolean;
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
    cancelFinishRequest(): boolean;
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
    transferToQueue(queue: QueueInfo): boolean;
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
    transferToUser(user: UserInfo): boolean;
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
    cancelTransferToQueue(): boolean;
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
    cancelTransferToUser(): boolean;
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
    dbGet(key: string, scope?: DataBaseType): string | null;
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
    dbSet(key: string, value: any, scope?: DataBaseType): boolean;
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
    dbDelete(key: string, scope: DataBaseType): boolean;
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
    dbGetAll(scope?: DataBaseType): ObjectType | null;
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
    dbCommit(): Promise<boolean>;
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
    apiProxy(url: string, data: any): Promise<unknown>;
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
    private addPhoto;
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
    getEnvVariable(name: string): string | null;
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
    static getEnvironmentVariable(name: string): string | null;
    /**
     * @hidden
     */
    validateWebChatInlineButton(button: WebChatInlineButton): boolean;
    private validateObject;
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
    setReplyWebChatInlineButtons(buttons: WebChatInlineButton[]): boolean;
    /**
     * Set Whatsapp Edna keyboard
     */
    setWhatsappEdnaKeyboard(keyboard_rows: WhatsappEdnaKeyboardButton[]): boolean;
    private setTags;
    /**
     * Adds tags by id.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  kit.addTags([12, 34]);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    addTags(tags: number[]): boolean;
    /**
     * Replaces all tags.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  kit.replaceTags([12, 34]);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    replaceTags(tags: number[]): boolean;
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
    getTags(withName?: boolean): Promise<number[]> | Promise<GetTagsResult[]>;
    /**
     * Set custom data.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  kit.setCustomData('my_data', {a: 1, b 'some text'}); // [12, 34]
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    setCustomData(name: string, data: unknown): boolean;
    /**
     * Delete custom data.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  kit.deleteCustomData('my_data');
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    deleteCustomData(name: string): boolean;
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
    getDfKey(id: number): ObjectType | null;
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
    getDfKeysList(): string[];
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
    getAvatarReply(): AvatarMessageObject | null;
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
    version(): string | void;
}
export = VoximplantKit;
