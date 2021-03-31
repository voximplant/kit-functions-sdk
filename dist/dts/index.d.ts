import { CallObject, ContextObject, QueueInfo, SkillObject, MessageObject, DataBaseType, ObjectType } from "./types";
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
    constructor(context: ContextObject);
    /**
     * @hidden
     */
    static default: typeof VoximplantKit;
    private getRequestDataProperty;
    private getRequestDataVariables;
    /**
     * load Databases
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Reading contents from global scope
     *    const global_scope = kit.dbGetAll('global');
     *    console.log(global_scope)
     *  } catch(err) {
     *    console.log(err);
     *  }
     * ```
     */
    loadDatabases(): Promise<void>;
    /**
     * Get function response
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param data
     */
    getResponseBody(data: any): any;
    /**
     * Get incoming message (Read only)
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Checking that the function is called from a channel
     *  if (kit.isMessage()) {
     *    // Getting text from an incoming message
     *    const message = kit.getIncomingMessage();
     *    console.log(message.text);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getIncomingMessage(): MessageObject | null;
    /**
     * Set the response text to an incoming message
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Checking that the function is called from a channel
     *  if (kit.isMessage()) {
     *    // Getting text from an incoming message
     *    const message = kit.getIncomingMessage();
     *    console.log(message.text);
     *    // Set the response text
     *    kit.setReplyMessageText('you wrote ' + message.text);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    setReplyMessageText(text: string): boolean;
    /**
     * The function was called from a call
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    console.log('This function is called from the call')
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    isCall(): boolean;
    /**
     * The function was called from a message
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isMessage()) {
     *    console.log('This function is called from the channel');
     *    const message = kit.getIncomingMessage();
     *    //...
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    isMessage(): boolean;
    /**
     * Get Variable
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  const my_var = kit.getVariable('my_var');
     *  if (my_var) {
     *    console.log(my_var);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getVariable(name: string): string | null;
    /**
     * Set variable
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  kit.setVariable('my_var', 'some_value');
     *  console.log(kit.getVariable('my_var'));
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name {String} - Variable name
     * @param value {String} - Variable value
     */
    setVariable(name: string, value: string): boolean;
    /**
     * Delete variable
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  kit.deleteVariable('my_var');
     *  // The console will write null
     *  console.log(kit.getVariable('my_var'));
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name {String} - Variable name
     */
    deleteVariable(name: string): void;
    /**
     * Get call headers
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    const headers = kit.getCallHeaders();
     *    console.log(headers);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getCallHeaders(): ObjectType | null;
    /**
     * Get all call data
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    const call = kit.getCallData();
     *    // Get the phone from which the call was made
     *    console.log(call.phone_a);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getCallData(): CallObject | null;
    /**
     * Get all variables
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  const all_vars = kit.getVariables();
     *  console.log('all_vars');
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getVariables(): ObjectType;
    /**
     * Get all skills
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isCall()) {
     *    const all_skills = kit.getSkills();
     *    console.log('All skills:', all_skills);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getSkills(): SkillObject[];
    /**
     * Set skill
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isCall()) {
     *    kit.setSkill('some_skill_name', 5);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name
     * @param level
     */
    setSkill(name: string, level: number): boolean;
    /**
     * Remove skill
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isCall()) {
     *    kit.removeSkill('some_skill_name');
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    removeSkill(name: string): boolean;
    /**
     * Set the priority of the call. The higher the priority, the less time the client will wait for the operator's answer.
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer to queue by name some_queue_name
     *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
     *  // Set the maximum priority
     *  kit.setPriority(10);
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    setPriority(value: number): boolean;
    /**
     * Get call priority
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Returns a number from 0 to 10
     *  const priority = kit.getPriority();
     *  if (priority === 10) {
     *    // Something to do
     *  } else if (priority === 5) {
     *    // Something to do
     *  } else {
     *    // Something to do
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getPriority(): number;
    /**
     * Finish current request in conversation
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isMessage()) {
     *    kit.finishRequest();
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    finishRequest(): boolean;
    /**
     * Cancel finish current request in conversation
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isMessage()) {
     *    kit.finishRequest();
     *  }
     *  // ...
     *  // Some condition for cancellation finishRequest
     *  const shouldCancel = true;
     *  if (shouldCancel) {
     *    kit.cancelFinishRequest();
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    cancelFinishRequest(): boolean;
    /**
     * Transfer to queue
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer to queue by name some_queue_name
     *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    transferToQueue(queue: QueueInfo): boolean;
    /**
     * Cancel transfer to queue
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer to queue by name some_queue_name
     *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
     *  //...
     *  // Some condition for cancellation transfer to queue
     *  const shouldCancel = true;
     *  if (shouldCancel) {
     *    kit.cancelTransferToQueue();
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    cancelTransferToQueue(): boolean;
    /**
     * Get value from DB by key
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Get the value from the function scope by the test_key key
     *    const _test = kit.dbGet('test_key', 'function')
     *    console.log(_test);
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    dbGet(key: string, scope?: DataBaseType): string | null;
    /**
     * Set value in DB by key
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Get the value from the function scope by the test_key key
     *    const _test = kit.dbGet('test_key', 'function')
     *    // If there is no data, then we write it down
     *    if (_test === null) {
     *      kit.dbSet('test_key', 'Hello world!!!', 'function');
     *    }
     *    // Writing changes to the database
     *    kit.dbCommit()
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    dbSet(key: string, value: any, scope?: DataBaseType): boolean;
    /**
     * Get all DB scope by name
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Reading contents from global scope
     *    const global_scope = kit.dbGetAll('global');
     *    console.log(global_scope)
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    dbGetAll(scope?: DataBaseType): ObjectType | null;
    /**
     * Commit DB changes
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Get the value from the function scope by the test_key key
     *    const _test = kit.dbGet('test_key', 'function')
     *    // If there is no data, then we write it down
     *    if (_test === null) {
     *      kit.dbSet('test_key', 'Hello world!!!', 'function');
     *    }
     *    // Writing changes to the database
     *    kit.dbCommit()
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    dbCommit(): Promise<boolean>;
    /**
     * Voximplant Kit API proxy
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
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param url {string} - Url address
     * @param data
     */
    apiProxy(url: string, data: any): Promise<unknown>;
    /**
     * Add photo
     * ```js
     * module.exports = async function(context, callback) {
     *  const kit = new VoximplantKit(context);
     *  kit.addPhoto('https://your-srite.com/img/some-photo.png');
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     *}
     * ```
     * @param url {String} - Url address
     * @returns {Boolean}
     */
    private addPhoto;
    /**
     * Get client version
     * ```js
     *  const kit = new VoximplantKit(context);
     *  // Get client version
     *  kit.version();
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    version(): string;
}
export = VoximplantKit;
