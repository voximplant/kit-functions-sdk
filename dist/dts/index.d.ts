import { AvatarMessageObject, CallDataObject, CallObject, ChannelDataObject, ContextObject, DataBaseType, GetTagsResult, IncomingMessageObject, ObjectType, QueueInfo, SkillObject, TelegramInlineKeyboardButton, TelegramReplyKeyboardButton, TelegramReplyKeyboardParams, TelegramReplyKeyboardRemove, UserInfo, WebChatInlineButton, WhatsappEdnaKeyboardRow } from "./types";
import Avatar from "./Avatar";
declare class VoximplantKit {
    private requestData;
    private accessToken;
    private sessionAccessUrl;
    private xFissionFunctionName;
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
     * @exampleFile index/constructor.md
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
     * @exampleFile index/getConversationUuid.md
     */
    getConversationUuid(): string | null;
    /**
     * Get the function URI by its id.
     * @exampleFile index/getFunctionUriById.md
     */
    getFunctionUriById(id: number): string | null;
    /**
     * Get the URL of the current function. Used for invoking the function as a callback.
     * @exampleFile index/getCurrentFunctionUri.md
     */
    getCurrentFunctionUri(): string | null;
    private getRequestDataProperty;
    private getRequestDataVariables;
    private getRequestDataTags;
    private getRequestDataAvatar;
    private findPayloadIndex;
    /**
     * Loads the databases available in the scope.
     * @exampleFile index/loadDatabases.md
     */
    loadDatabases(): Promise<void>;
    private _getVariables;
    /**
     * Gets a message object.
     * @exampleFile index/getMessageObject.md
     */
    getMessageObject(): ChannelDataObject | ObjectType;
    /**
     * Gets a function response. Needs to be called at the end of each function.
     * @exampleFile index/getResponseBody.md
     */
    getResponseBody(): CallDataObject | ChannelDataObject | undefined;
    /**
     * Gets an incoming message.
     * @exampleFile index/getIncomingMessage.md
     */
    getIncomingMessage(): IncomingMessageObject | null;
    /**
     * Sets a reply message text.
     * @exampleFile index/setReplyMessageText.md
     * @param text {string} - Reply text
     */
    setReplyMessageText(text: string): boolean;
    /**
     * The function is called from a call.
     * @exampleFile index/isCall.md
     */
    isCall(): boolean;
    /**
     * The function is called from a message.
     * @exampleFile index/isMessage.md
     */
    isMessage(): boolean;
    /**
     * The function is called by the avatar.
     * @exampleFile index/isAvatar.md
     */
    isAvatar(): boolean;
    /**
     * Gets a variable by name.
     * @exampleFile index/getVariable.md
     * @param name {string} - Variable name
     */
    getVariable(name: string): string | null;
    /**
     * Adds a variable or updates it if the variable name already exists.
     * @exampleFile index/setVariable.md
     * @param name {string} - Variable name
     * @param value {any} - Variable value
     */
    setVariable(name: string, value: any): boolean;
    /**
     * Deletes a variable by name.
     * @exampleFile index/deleteVariable.md
     * @param name {string} - Variable name
     */
    deleteVariable(name: string): boolean;
    /**
     * Gets call headers.
     * @exampleFile index/getCallHeaders.md
     */
    getCallHeaders(): ObjectType | null;
    /**
     * Gets all call data.
     * @exampleFile index/getCallData.md
     */
    getCallData(): CallObject | null;
    /**
     * Gets all variables.
     * @exampleFile index/getVariables.md
     */
    getVariables(): ObjectType;
    /**
     * Gets all skills.
     * @exampleFile index/getSkills.md
     */
    getSkills(): SkillObject[];
    /**
     * Adds a skill or updates it if the skill id already exists.
     * @exampleFile index/setSkill.md
     */
    setSkill(skill: SkillObject): boolean;
    /**
     * Removes a skill by id.
     * @exampleFile index/removeSkill.md
     * @param id {Number} - Name of the skill to remove
     */
    removeSkill(id: number): boolean;
    /**
     * Sets the call priority. The higher the priority, the less time a client will wait for the operator's response.
     * @exampleFile index/setPriority.md
     * @param value {number} - Priority value, from 0 to 10
     */
    setPriority(value: number): boolean;
    /**
     * Gets call priorities.
     * @exampleFile index/getPriority.md
     */
    getPriority(): number;
    /**
     * Closes the client's request.
     * @exampleFile index/finishRequest.md
     */
    finishRequest(): boolean;
    /**
     * Reopens the client's request.
     * @exampleFile index/cancelFinishRequest.md
     */
    cancelFinishRequest(): boolean;
    /**
     * Transfers a client to the queue.
     * @exampleFile index/transferToQueue.md
     */
    transferToQueue(queue: QueueInfo): boolean;
    /**
     * Transfers a client to the user. Only for text channels and Avatar.
     * @exampleFile index/transferToUser.md
     */
    transferToUser(user: UserInfo): boolean;
    /**
     * Cancels transferring a client to the queue.
     * @exampleFile index/cancelTransferToQueue.md
     */
    cancelTransferToQueue(): boolean;
    /**
     * Cancels transferring a client to the user.
     * @exampleFile index/cancelTransferToUser.md
     */
    cancelTransferToUser(): boolean;
    /**
     * Gets a value from the database scope by key. Available only after loadDatabases() execution.
     * @exampleFile index/dbGet.md
     * @param key {string} - Key
     * @param scope {DataBaseType} - Database scope
     */
    dbGet(key: string, scope?: DataBaseType): string | null;
    /**
     * Adds a value to the database scope or updates it if the key already exists. Available only after loadDatabases() execution.
     * @exampleFile index/dbSet.md
     * @param key {string} - Key
     * @param value {any} - Value
     * @param scope {DataBaseType} - Database scope
     */
    dbSet(key: string, value: any, scope?: DataBaseType): boolean;
    /**
     * Deletes a value from the specified database scope, if the key already exists. Available only after loadDatabase() execution.
     * @exampleFile index/dbDelete.md
     * @param key {string} - Key
     * @param scope {DataBaseType} - Database scope
     */
    dbDelete(key: string, scope: DataBaseType): boolean;
    /**
     * Gets the whole database scope by name. Available only after loadDatabases() execution.
     * @exampleFile index/dbGetAll.md
     * @param scope {DataBaseType} - Database scope
     */
    dbGetAll(scope?: DataBaseType): ObjectType | null;
    /**
     * Adds changes to the database. Available only after loadDatabases() execution.
     * @exampleFile index/dbCommit.md
     */
    dbCommit(): Promise<boolean>;
    /**
     * Allows you to use the Voximplant Kit API.
     * @exampleFile index/apiProxy.md
     * @param url {string} - URL address
     * @param data
     */
    apiProxy(url: string, data: any): Promise<unknown>;
    /**
     * Adds a photo.
     * @exampleFile index/addPhoto.md
     * @param url {String} - URL address of the photo
     * @returns {Boolean}
     */
    private addPhoto;
    /**
     * Gets an environment variable by name.
     * [More details here.](https://voximplant.com/kit/docs/functions/envvariables)
     * @exampleFile index/getEnvVariable.md
     * @param name {string} - Variable name
     */
    getEnvVariable(name: string): string | null;
    /**
     * A static method used outside the function body that gets environment variables.
     * @exampleFile index/getEnvironmentVariable.md
     */
    static getEnvironmentVariable(name: string): string | null;
    /**
     * @hidden
     */
    private validateWebChatInlineButton;
    private validateObject;
    private validateTelegramReplyKeyboardParams;
    /**
     * Adds buttons for the web chat channel
     * @exampleFile index/setReplyWebChatInlineButtons.md
     */
    setReplyWebChatInlineButtons(buttons: WebChatInlineButton[]): boolean;
    /**
     * Adds inline keyboard for the telegram channel
     * @exampleFile index/setTelegramInlineKeyboard.md
     */
    setTelegramInlineKeyboard(keyboard_markup: TelegramInlineKeyboardButton[][]): boolean;
    private validateTelegramInlineKeyboardButton;
    /**
     * Adds reply keyboard for the telegram channel
     * @exampleFile index/setTelegramReplyKeyboard.md
     */
    setTelegramReplyKeyboard(keyboard_markup: TelegramReplyKeyboardButton[][], keyboard_params?: TelegramReplyKeyboardParams): boolean;
    /**
     * Remove replyKeyboard for telegram channel
     * @exampleFile index/setTelegramReplyKeyboardRemove.md
     */
    setTelegramReplyKeyboardRemove(remove_params: TelegramReplyKeyboardRemove): boolean;
    private setPayloadByIndex;
    /**
     * Set Whatsapp Edna keyboard
     * @exampleFile index/setWhatsappEdnaKeyboard.md
     */
    setWhatsappEdnaKeyboard(keyboard_rows: WhatsappEdnaKeyboardRow[]): boolean;
    private setTags;
    /**
     * Adds tags by id.
     * This method allows you to add tags to the current context.
     *
     * @exampleFile index/addTags.md
     */
    addTags(tags: number[]): boolean;
    /**
     * Replaces all tags.
     * @exampleFile index/replaceTags.md
     */
    replaceTags(tags: number[]): boolean;
    /**
     * Gets tags.
     * @exampleFile index/getTags.md
     * @param withName {Boolean} - If the argument is true, it returns the array with the id and tag names. Otherwise, it will return the array with the id tags
     */
    getTags(withName?: boolean): Promise<number[]> | Promise<GetTagsResult[]>;
    /**
     * Set custom data.
     * @exampleFile index/setCustomData.md
     */
    setCustomData(name: string, data: unknown): boolean;
    /**
     * Delete custom data.
     * @exampleFile index/deleteCustomData.md
     */
    deleteCustomData(name: string): boolean;
    /**
     * Get DialogFlow key by id.
     * @exampleFile index/getDfKey.md
     */
    getDfKey(id: number): ObjectType | null;
    /**
     * Gets a list of available DialogFlow keys
     * @exampleFile index/getDfKeysList.md
     */
    getDfKeysList(): string[];
    /**
     * Gets an avatar reply
     * @exampleFile index/getAvatarReply.md
     */
    getAvatarReply(): AvatarMessageObject | null;
    /**
     * Gets a client’s SDK version.
     * @exampleFile index/version.md
     */
    version(): string | void;
}
export = VoximplantKit;
