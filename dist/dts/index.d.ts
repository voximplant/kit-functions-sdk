import { CallObject, ContextObject, MessageObject, QueueInfo, SkillObject } from "./types";
declare const enum EVENT_TYPES {
    in_call_function = "in_call_function",
    incoming_message = "incoming_message",
    webhook = "webhook"
}
declare class VoximplantKit {
    private isTest;
    private requestData;
    private responseData;
    private accessToken;
    private sessionAccessUrl;
    private apiUrl;
    private domain;
    private functionId;
    eventType: EVENT_TYPES;
    call: CallObject;
    variables: object;
    headers: object;
    skills: Array<SkillObject>;
    private priority;
    incomingMessage: MessageObject;
    replyMessage: MessageObject;
    private conversationDB;
    private functionDB;
    private accountDB;
    private db;
    api: any;
    private http;
    constructor(context: ContextObject, isTest?: boolean);
    static default: typeof VoximplantKit;
    /**
     * load Databases
     */
    loadDatabases(): Promise<void>;
    setPriority(value: number): number;
    getPriority(): number;
    /**
     * Get function response
     * @param data
     */
    getResponseBody(data: any): any;
    /**
     * Get incoming message
     */
    getIncomingMessage(): MessageObject;
    /**
     * Set auth token
     * @param token
     */
    setAccessToken(token: any): void;
    /**
     * Get Variable
     * @param name
     */
    getVariable(name: string): any;
    /**
     * Set variable
     * @param name {String}
     * @param value {String}
     */
    setVariable(name: string, value: string): void;
    /**
     * Get all call data
     */
    getCallData(): any;
    /**
     * Get all variables
     */
    getVariables(): {
        [key: string]: string;
    };
    /**
     * Get all skills
     */
    getSkills(): any;
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
    private loadDB;
    private saveDB;
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
    dbGet(key: string, scope?: string): any;
    /**
     * Set value in DB by key
     * @param key
     * @param value
     * @param scope
     */
    dbSet(key: string, value: any, scope?: string): void;
    /**
     * Get all DB scope by name
     * @param scope
     */
    dbGetAll(scope?: string): any;
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
    sendSMS(from: string, to: string, message: string): any;
    /**
     * Voximplant Kit API proxy
     * @param url {string} - Url address
     * @param data
     */
    apiProxy(url: string, data: any): any;
    /**
     * Add photo
     *
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
