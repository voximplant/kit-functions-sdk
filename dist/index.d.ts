import { AxiosInstance } from 'axios';
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
    body: object;
    headers: object;
}
export interface SkillObject {
    skill_name: string;
    level: number;
}
export interface ResponseDataObject {
    VARIABLES: object;
    SKILLS: Array<SkillObject>;
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
    channel_type: string;
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
export interface MessageObject {
    text: string;
    type: string;
    sender: MessageSender;
    conversation: MessageConversation;
    payload: Array<MessagePayloadItem>;
    customer: MessageCustomer;
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
export interface IncomingMessageObject {
    text: string;
    type: string;
    conversation_uuid: string;
    client_data: ConversationCustomDataClientDataObject;
    conversation_data: ConversationCustomDataConversationDataObject;
    current_request: IncomingRequestObject;
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
export interface MessageSenderObject {
    client_id: string;
    client_phone: string;
    client_avatar: string;
    client_display_name: string;
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
export default class VoximplantKit {
    private isTest;
    private requestData;
    private responseData;
    private accessToken;
    private sessionAccessUrl;
    private apiUrl;
    private domain;
    private functionId;
    eventType: string;
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
    http: AxiosInstance;
    constructor(context: ContextObject, isTest?: boolean);
    loadDatabases(): Promise<void>;
    setPriority(value: number): number;
    getPriority(): number;
    getResponseBody(data: any): any;
    getIncomingMessage(): MessageObject;
    setAccessToken(token: any): void;
    getVariable(name: string): any;
    setVariable(name: any, value: any): void;
    getCallData(): any;
    getVariables(): any;
    getSkills(): any;
    setSkill(name: string, level: number): void;
    removeSkill(name: string): void;
    finishRequest(): boolean;
    cancelFinishRequest(): boolean;
    transferToQueue(queue: QueueInfo): boolean;
    cancelTransferToQueue(): boolean;
    private loadDB;
    private saveDB;
    private saveDb;
    dbGet(key: string, scope?: string): any;
    dbSet(key: string, value: any, scope?: string): void;
    dbGetAll(scope?: string): any;
    dbCommit(): Promise<void>;
    sendSMS(from: string, to: string, message: string): any;
    apiProxy(url: string, data: any): any;
    addPhoto(url: any): boolean;
    version(): string;
}
