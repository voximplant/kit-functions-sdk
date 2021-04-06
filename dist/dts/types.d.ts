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
export declare type RequestData = RequestObjectCallBody | MessageObject | ObjectType;
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
    account: object;
    /**
     * Channel name
     */
    channel_type: ChannelType;
    /**
     * Channel settings
     */
    channel_settings: object;
    processing_method: string;
    processing_queue: object;
    processing_function: number;
    partner_id: number;
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
    start_sequence: number;
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
    channel_type: string;
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
export declare type DataBaseType = 'function' | 'global' | 'conversation';
export declare type ChannelType = 'telegram' | 'whatsapp-edna' | 'viber' | 'sms' | 'facebook' | 'vk' | 'odnoklassniki' | 'custom' | 'webchat';
/**
 * @hidden
 */
export interface ApiInstance {
    request<T, R = AxiosResponse<T>>(requestUrl: string, data: any): Promise<R>;
}
export declare type DbResponse = {
    result: string;
};
export declare type ObjectType = {
    [key: string]: string;
};
