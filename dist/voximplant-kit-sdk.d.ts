// Generated by dts-bundle v0.7.3
// Dependencies for this module:
//   ../../axios

declare module '@voximplant/kit-functions-sdk' {
    import { CallObject, ContextObject, QueueInfo, SkillObject, MessageObject, DataBaseType, ObjectType } from "@voximplant/kit-functions-sdk/types";
    class VoximplantKit {
            replyMessage: MessageObject;
            incomingMessage: MessageObject;
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
                * Get client version
                */
            version(): string;
    }
    export = VoximplantKit;
}

declare module '@voximplant/kit-functions-sdk/types' {
    import { AxiosResponse } from "axios";
    export interface CallObject {
        id: number;
        result_code: number;
        attempt_num: number;
        session_id: string;
        callerid: string;
        destination: string;
        display_name: string;
        phone_a: string;
        phone_b: string;
        record_url: string;
    }
    export interface ContextObject {
        request: RequestObject;
    }
    export interface RequestObject {
        body: RequestData;
        headers: ObjectType;
    }
    export type RequestData = RequestObjectCallBody | MessageObject | ObjectType;
    export interface RequestObjectCallBody {
        CALL: CallObject;
        SKILLS: SkillObject[];
        VARIABLES: ObjectType;
        HEADERS: ObjectType;
    }
    export interface SkillObject {
        skill_name: string;
        level: number;
    }
    export interface MessageObject {
        id: number;
        text: string;
        type: string;
        sender: MessageSender;
        conversation: MessageConversation;
        payload: Array<MessagePayloadItem>;
        customer: MessageCustomer;
        HasMedia: boolean;
    }
    export interface MessageConversation {
        id: number;
        uuid: string;
        client_id: string;
        custom_data: ConversationCustomDataObject;
        current_status: string;
        current_request: IncomingRequestObject;
        channel: MessageConversationChannel;
        customer_id?: number;
    }
    export interface MessageConversationChannel {
        id: number;
        channel_uuid: string;
        account: object;
        channel_type: AgentChannelType;
        channel_settings: object;
        processing_method: string;
        processing_queue: object;
        processing_function: number;
        partner_id: number;
        access_token: string;
    }
    export interface ConversationCustomDataObject {
        client_data: ConversationCustomDataClientDataObject;
        conversation_data: ConversationCustomDataConversationDataObject;
        request_data: ConversationCustomDataRequestData;
        customer_data?: {
            id: number;
        };
    }
    export interface ConversationCustomDataRequestData {
        id: number;
        conversation_id: number;
        start_sequence: number;
        end_sequence: any;
        start_time: number;
        handling_start_time: number;
        end_time: number;
        completed: boolean;
        variables: ObjectType;
    }
    export interface ConversationCustomDataClientDataObject {
        client_id: string;
        client_phone: string;
        client_avatar: string;
        client_display_name: string;
    }
    export interface ConversationCustomDataConversationDataObject {
        last_message_text: string;
        last_message_time: number;
        channel_type: string;
        last_message_sender_type: string;
        is_read: boolean;
    }
    export interface QueueInfo {
        queue_id: number;
        queue_name: string;
    }
    export interface MessageCustomer {
        id: number;
        customer_display_name: string;
        customer_details: string;
        customer_photo: string;
        customer_phones: string[];
        customer_client_ids: MessageCustomerClientIds[];
        customer_external_id: string;
        customer_emails: string[];
    }
    export interface MessageCustomerClientIds {
        client_id: string;
        client_type: string;
    }
    export interface IncomingRequestObject {
        id: number;
        conversation_id: number;
        start_sequence: number;
        end_sequence: number;
        start_time: number;
        handling_start_time: number;
        end_time: number;
        completed: boolean;
    }
    export interface MessageSender {
        is_bot: boolean;
    }
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
        function: ObjectType;
        global: ObjectType;
        conversation: ObjectType;
    }
    export type DataBaseType = 'function' | 'global' | 'conversation';
    export type AgentChannelType = 'telegram' | 'whatsapp-edna' | 'viber' | 'sms' | 'facebook' | 'vk' | 'odnoklassniki' | 'custom' | 'webchat';
    export interface ApiInstance {
        request<T, R = AxiosResponse<T>>(requestUrl: string, data: any): Promise<R>;
    }
    export type DbResponse = {
        result: string;
    };
    export type ObjectType = {
        [id: string]: string;
    };
}

