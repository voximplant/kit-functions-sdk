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
    private incomingMessage;
    private replyMessage;
    private eventType;
    constructor(context: ContextObject, isTest?: boolean);
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
     * Get incoming message
     */
    getIncomingMessage(): MessageObject | null;
    /**
     * Set auth token
     * @param token
     */
    setAccessToken(token: string): void;
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
    setVariable(name: string, value: string): void;
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
    setSkill(name: string, level: number): void;
    /**
     * Remove skill
     * @param name
     */
    removeSkill(name: string): void;
    setPriority(value: number): number;
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
    dbGet(key: string, scope?: DataBaseType): any;
    /**
     * Set value in DB by key
     * @param key
     * @param value
     * @param scope {DataBaseType}
     */
    dbSet(key: string, value: any, scope?: DataBaseType): void;
    /**
     * Get all DB scope by name
     * @param scope
     */
    dbGetAll(scope?: DataBaseType): ObjectType;
    /**
     * Commit DB changes
     */
    dbCommit(): Promise<void>;
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
    addPhoto(url: string): boolean;
    /**
     * Get client version
     */
    version(): string;
}
export = VoximplantKit;
