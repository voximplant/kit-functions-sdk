// Generated by dts-bundle v0.7.3
// Dependencies for this module:
//   ../../axios

declare module '@voximplant/kit-functions-sdk' {
    import { CallObject, ContextObject, QueueInfo, SkillObject, MessageObject, DataBaseType, ObjectType } from "@voximplant/kit-functions-sdk/types";
    class VoximplantKit {
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
            /**
                * Gets a function response. Needs to be called at the end of each function.
                * ```js
                *  // Initialize a VoximplantKit instance
                *  const kit = new VoximplantKit(context);
                *  // End of function
                *  callback(200, kit.getResponseBody());
                * ```
                */
            getResponseBody(): {
                    VARIABLES: ObjectType;
                    SKILLS: SkillObject[];
                    text?: undefined;
                    payload?: undefined;
                    variables?: undefined;
            } | {
                    text: string;
                    payload: import("./types").MessagePayloadItem[];
                    variables: ObjectType;
                    VARIABLES?: undefined;
                    SKILLS?: undefined;
            };
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
                * @param value {string} - Variable value to add or update
                */
            setVariable(name: string, value: string): boolean;
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
            deleteVariable(name: string): void;
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
            setSkill(name: string, level: number): boolean;
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
            removeSkill(name: string): boolean;
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
                *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
                *  // End of function
                *  callback(200, kit.getResponseBody());
                * ```
                * @param queue {QueueInfo} - Queue name or id
                */
            transferToQueue(queue: QueueInfo): boolean;
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
            dbSet(key: string, value: any, scope?: DataBaseType): boolean;
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
                *    kit.dbCommit()
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
                * Gets a client’s SDK version.
                * ```js
                *  const kit = new VoximplantKit(context);
                *  // Get a client’s SDK version
                *  kit.version();
                *  // End of function
                *  callback(200, kit.getResponseBody());
                * ```
                */
            version(): string;
    }
    export = VoximplantKit;
}

declare module '@voximplant/kit-functions-sdk/types' {
    import { AxiosResponse } from "axios";
    export interface CallObject {
            id: number;
            /**
                * @hidden
                */
            result_code: number;
            /**
                * Attempt number
                */
            attempt_num: number;
            session_id: string;
            callerid: string;
            destination: string;
            display_name: string;
            /**
                * Caller phone number
                */
            phone_a: string;
            /**
                * Callee phone number
                */
            phone_b: string;
            /**
                * Recording URL
                */
            record_url: string;
    }
    /**
        * @hidden
        */
    export interface ContextObject {
            request: RequestObject;
    }
    /**
        * @hidden
        */
    export interface RequestObject {
            body: RequestData;
            headers: ObjectType;
    }
    /**
        * @hidden
        */
    export type RequestData = RequestObjectCallBody | MessageObject | ObjectType;
    /**
        * @hidden
        */
    export interface RequestObjectCallBody {
            CALL: CallObject;
            SKILLS: SkillObject[];
            VARIABLES: ObjectType;
            HEADERS: ObjectType;
    }
    export interface SkillObject {
            /**
                * Skill name
                */
            skill_name: string;
            /**
                * Proficiency level
                */
            level: number;
    }
    export interface MessageObject {
            /**
                * Message id
                */
            id: number;
            /**
                * Message text
                */
            text: string;
            /**
                * @hidden
                */
            type: string;
            /**
                * Sender of the message
                */
            sender: MessageSender;
            /**
                * Conversation that the message belongs to
                */
            conversation: MessageConversation;
            /**
                * @hidden
                */
            payload: Array<MessagePayloadItem>;
            /**
                * Entity for combining different channels of one client
                */
            customer: MessageCustomer;
            /**
                * @hidden
                */
            HasMedia: boolean;
    }
    export interface MessageConversation {
            /**
             * Conversation id
             */
            id: number;
            /**
                * @hidden
                */
            uuid: string;
            /**
             * Client id in the remote channel, external identifier
             */
            client_id: string;
            /**
                * Custom data object
                */
            custom_data: ConversationCustomDataObject;
            /**
                * Current status of the request: being processed, closed, etc.
                */
            current_status: string;
            /**
                * Current request object
                */
            current_request: IncomingRequestObject;
            /**
                * Conversation channel object
                */
            channel: MessageConversationChannel;
            /**
                * @hidden
                */
            customer_id?: number;
    }
    export interface MessageConversationChannel {
            /**
                * Channel id
                */
            id: number;
            channel_uuid: string;
            /**
                * @hidden
                */
            account: object;
            /**
                * Channel name
                */
            channel_type: ChannelType;
            /**
                * @hidden
                */
            channel_settings: object;
            processing_method: string;
            processing_queue: object;
            processing_function: number;
            /**
                * @hidden
                */
            partner_id: number;
            /**
                * @hidden
                */
            access_token: string;
    }
    export interface ConversationCustomDataObject {
            /**
                * Client data
                */
            client_data: ConversationCustomDataClientDataObject;
            /**
                * Conversation data
                */
            conversation_data: ConversationCustomDataConversationDataObject;
            /**
                * Request data
                */
            request_data: ConversationCustomDataRequestData;
            /**
                * Customer data
                */
            customer_data?: {
                    id: number;
            };
    }
    export interface ConversationCustomDataRequestData {
            id: number;
            /**
                * Conversation id (the whole chat in the channel)
                */
            conversation_id: number;
            /**
                * @hidden
                */
            start_sequence: number;
            /**
                * @hidden
                */
            end_sequence: any;
            /**
                * Time when the request was created
                */
            start_time: number;
            /**
                * Time when the agent started processing the request
                */
            handling_start_time: number;
            /**
                * Time when the request was closed
                */
            end_time: number;
            /**
                * Conversation is complete
                */
            completed: boolean;
            variables: ObjectType;
    }
    export interface ConversationCustomDataClientDataObject {
            /**
                * Client id in the remote channel, external identifier
                */
            client_id: string;
            /**
                * Client phone number
                */
            client_phone: string;
            /**
                * Client avatar URL
                */
            client_avatar: string;
            /**
                * Client display name
                */
            client_display_name: string;
    }
    export interface ConversationCustomDataConversationDataObject {
            /**
                * Text of the last message
                */
            last_message_text: string;
            /**
                * Time when the last message was sent
                */
            last_message_time: number;
            /**
                * Channel from which the message was sent
                */
            channel_type: ChannelType;
            /**
                * Sender of the last message
                */
            last_message_sender_type: string;
            /**
                * Message is read
                */
            is_read: boolean;
    }
    export interface QueueInfo {
            /**
                * Queue id. Can be used instead of <b>queue_name</b>
                */
            queue_id: number;
            /**
                * Queue name. Can be used instead of <b>queue_id</b>
                */
            queue_name: string;
    }
    export interface MessageCustomer {
            /**
                * Customer id
                */
            id: number;
            /**
                * Customer display name
                */
            customer_display_name: string;
            /**
                * Customer details
                */
            customer_details: string;
            /**
                * Customer photo URL
                */
            customer_photo: string;
            /**
                * Array of phone numbers
                */
            customer_phones: string[];
            /**
                * Array of the client's channels
                */
            customer_client_ids: MessageCustomerClientIds[];
            /**
                * Additional customer info
                */
            customer_external_id: string;
            /**
                * Array of email addresses
                */
            customer_emails: string[];
    }
    export interface MessageCustomerClientIds {
            /**
                * Client id in the remote channel, external identifier. Can be email, phone number, etc. depending on the channel type
                */
            client_id: string;
            /**
                * Channel type
                */
            client_type: string;
    }
    export interface IncomingRequestObject {
            /**
                * Request id
                */
            id: number;
            /**
                * Conversation id (the whole chat in the channel)
                */
            conversation_id: number;
            /**
                * @hidden
                */
            start_sequence: number;
            /**
                * @hidden
                */
            end_sequence: number;
            /**
                * Time when the request was created
                */
            start_time: number;
            /**
                * Time when the agent started processing the request
                */
            handling_start_time: number;
            /**
                * Time when the request was closed
                */
            end_time: number;
            /**
                * Conversation is complete
                */
            completed: boolean;
    }
    export interface MessageSender {
            /**
                * Message sender is a bot
                */
            is_bot: boolean;
    }
    /**
        * TODO add methods to get properties
        * @hidden
        */
    export interface MessagePayloadItem {
            type: string;
            message_type?: string;
            name?: string;
            queue?: QueueInfo;
            skills?: Array<SkillObject>;
            priority?: number;
            text?: string;
            url?: string;
            latitude?: number;
            longitude?: number;
            address?: string;
            keys?: any;
            file_name?: string;
            file_size?: number;
    }
    export interface DataBase {
            /**
                * Function scope
                */
            function: ObjectType;
            /**
                * Global scope
                */
            global: ObjectType;
            /**
                * Conversation scope
                */
            conversation: ObjectType;
    }
    /**
        * @hidden
        */
    export type DateBasePutParams = {
            name: string;
            scope: DataBaseType;
    };
    export type DataBaseType = 'function' | 'global' | 'conversation';
    export type ChannelType = 'telegram' | 'whatsapp-edna' | 'viber' | 'sms' | 'facebook' | 'vk' | 'odnoklassniki' | 'custom' | 'webchat';
    /**
        * @hidden
        */
    export interface ApiInstance {
            request<T, R = AxiosResponse<T>>(requestUrl: string, data: any): Promise<R>;
    }
    export type DbResponse = {
            result: string;
    };
    export type ObjectType = {
            [key: string]: string;
    };
}

