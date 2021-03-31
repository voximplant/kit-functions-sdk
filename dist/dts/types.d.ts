import { AxiosResponse } from "axios";
export interface CallObject {
    id: number;
    /**
     * @hidden
     */
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
    skill_name: string;
    level: number;
}
export interface MessageObject {
    id: number;
    text: string;
    /**
     * @hidden
     */
    type: string;
    sender: MessageSender;
    conversation: MessageConversation;
    /**
     * @hidden
     */
    payload: Array<MessagePayloadItem>;
    customer: MessageCustomer;
    /**
     * @hidden
     */
    HasMedia: boolean;
}
export interface MessageConversation {
    id: number;
    /**
     * @hidden
     */
    uuid: string;
    client_id: string;
    custom_data: ConversationCustomDataObject;
    current_status: string;
    current_request: IncomingRequestObject;
    channel: MessageConversationChannel;
    /**
     * @hidden
     */
    customer_id?: number;
}
export interface MessageConversationChannel {
    id: number;
    channel_uuid: string;
    account: object;
    channel_type: ChannelType;
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
    /**
     * @hidden
     */
    start_sequence: number;
    /**
     * @hidden
     */
    end_sequence: number;
    start_time: number;
    handling_start_time: number;
    end_time: number;
    completed: boolean;
}
export interface MessageSender {
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
    function: ObjectType;
    global: ObjectType;
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
