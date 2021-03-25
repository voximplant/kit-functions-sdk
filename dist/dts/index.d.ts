import { CallObject, ContextObject, QueueInfo, SkillObject, MessageObject, DataBaseType, ObjectType } from "./types";
declare class VoximplantKit {
    private isTest;
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
    constructor(context: ContextObject, isTest?: boolean);
    /**
     * @hidden
     */
    static default: typeof VoximplantKit;
    /**
     * load Databases
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
    /**
     * Get reply message (Read only)
     * @readonly
     */
    getReplyMessage(): MessageObject | null;
    setReplyMessageText(text: string): boolean;
    /**
     * Set auth token
     * @param token
     */
    setAccessToken(token: string): boolean;
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
    /**
     * Get all variables
     */
    private getVariablesFromContext;
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
     * Send SMS message
     * @param from
     * @param to
     * @param message
     */
    sendSMS(from: string, to: string, message: string): Promise<unknown>;
    /**
     * Voximplant Kit API proxy
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
