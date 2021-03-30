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
     *    // Reading the contents of the database
     *    const scopes = kit.dbGetAll();
     *    console.log(scopes)
     *  } catch(err) {
     *    console.log(err);
     *  }
     * ```
     */
    loadDatabases(): Promise<void>;
    /**
     * Get function response
     * @param data
     */
    getResponseBody(data: any): any;
    /**
     * Get incoming message (Read only)
     */
    getIncomingMessage(): MessageObject | null;
    setReplyMessageText(text: string): boolean;
    /**
     * The function was called from a call
     */
    isCall(): boolean;
    /**
     * The function was called from a message
     */
    isMessage(): boolean;
    /**
     * Get Variable
     * @param name
     */
    getVariable(name: string): string | null;
    /**
     * Set variable
     * @param name {String} - Variable name
     * @param value {String} - Variable value
     */
    setVariable(name: string, value: string): boolean;
    /**
     * Delete variable
     * @param name {String} - Variable name
     */
    deleteVariable(name: string): void;
    getCallHeaders(): ObjectType | null;
    /**
     * Get all call data
     */
    getCallData(): CallObject | null;
    getVariables(): ObjectType;
    /**
     * Get all skills
     */
    getSkills(): SkillObject[];
    /**
     * Set skill
     * @param name
     * @param level
     */
    setSkill(name: string, level: number): boolean;
    /**
     * Remove skill
     * @param name
     */
    removeSkill(name: string): boolean;
    setPriority(value: number): boolean;
    getPriority(): number;
    /**
     * Finish current request in conversation
     */
    finishRequest(): boolean;
    /**
     * Cancel finish current request in conversation
     */
    cancelFinishRequest(): boolean;
    /**
     * Transfer to queue
     */
    transferToQueue(queue: QueueInfo): boolean;
    /**
     * Cancel transfer to queue
     */
    cancelTransferToQueue(): boolean;
    /**
     * Save DB by scope name
     * @param type
     * @private
     */
    private saveDb;
    /**
     * Get value from DB by key
     * @param key
     * @param scope
     */
    dbGet(key: string, scope?: DataBaseType): string | null;
    /**
     * Set value in DB by key
     * @param key
     * @param value
     * @param scope {DataBaseType}
     */
    dbSet(key: string, value: any, scope?: DataBaseType): boolean;
    /**
     * Get all DB scope by name
     * @param scope
     */
    dbGetAll(scope?: DataBaseType): ObjectType | null;
    /**
     * Commit DB changes
     */
    dbCommit(): Promise<boolean>;
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
    apiProxy(url: string, data: any): Promise<unknown>;
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
    private addPhoto;
    /**
     * Get client version
     */
    version(): string;
}
export = VoximplantKit;
