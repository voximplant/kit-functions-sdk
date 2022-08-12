import { AxiosResponse } from "axios";
import utils from "./utils";

export interface CallObject {
  id: number
  /**
   * @hidden
   */
  result_code: number
  /**
   * Attempt number
   */
  attempt_num: number
  /**
   * Voximplant session id
   */
  session_id: string
  /**
   Caller phone number
   */
  callerid: string
  /**
   * Destination phone number
   */
  destination: string
  /**
   Name of the caller that is displayed to the called party. Normally it's a human-readable version of CallerID, e.g. a person's name
   */
  display_name: string
  /**
   * Caller phone number. Equivalent to the <b>callerid</b> value
   */
  phone_a: string
  /**
   * Destination phone number. Equivalent to the <b>destination</b> value
   */
  phone_b: string
  /**
   * Recording URL
   */
  record_url: string
}

/**
 * @hidden
 */
export interface ContextObject {
  request: RequestObject
}

/**
 * @hidden
 */
export interface RequestObject {
  body: RequestData,
  headers: ObjectType
}

/**
 * @hidden
 */
export type RequestData = RequestObjectCallBody | MessageObject | ObjectType | AvatarMessageObject;

export interface AvatarMessageObject  {
  is_final: boolean;
  response: string;
  custom_data: null | string;
  conversation_id: string;
}

/**
 * @hidden
 */
export interface RequestObjectCallBody {
  CALL: CallObject,
  SKILLS: SkillObject[],
  VARIABLES: ObjectType,
  HEADERS: ObjectType,
  TAGS: number[]
}

export interface SkillObject {
  /**
   * Proficiency level
   */
  level: number,
  /**
   * Skill id
   */
  skill_id?: number;
}

export interface MessageObject {
  /**
   * Message id
   */
  id: number,
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
  HasMedia: boolean
}

export interface CallDataObject   {
  "VARIABLES": ObjectType,
  "SKILLS": SkillObject[],
  "TAGS": number[]
}

export interface ChannelDataObject  {
  text: string,
  payload: Array<MessagePayloadItem>,
  variables: ObjectType
}

export interface MessageConversation {
  /**
   * Conversation id
   */
  id: number
  /**
   * @hidden
   */
  uuid: string
  /**
   * Client id in the remote channel, external identifier
   */
  client_id: string
  /**
   * Custom data object
   */
  custom_data: ConversationCustomDataObject
  /**
   * Current status of the request: new, unassigned, processed_by_function, waiting_agent, processed_by_agent, done
   */
  current_status: string
  /**
   * Current request object
   */
  current_request: IncomingRequestObject,
  /**
   * Conversation channel object
   */
  channel: MessageConversationChannel,
  /**
   * @hidden
   */
  customer_id?: number,
}

export interface MessageConversationChannel {
  /**
   * Channel id
   */
  id: number
  /**
   * Channel universally unique identifier (UUID)
   */
  channel_uuid: string,
  /**
   * @hidden
   */
  account: object,
  /**
   * Channel type
   */
  channel_type: ChannelType,// 'telegram'
  /**
   * @hidden
   */
  channel_settings: object,
  /**
   * Channel processing method (a function or a queue)
   */
  processing_method: string,
  /**
   * Queue that processes the channel if the processing method is a queue
   */
  processing_queue: object,
  /**
   * Function that processes the channel if the processing method is a function
   */
  processing_function: number,
  /**
   * @hidden
   */
  partner_id: number,
  /**
   * @hidden
   */
  access_token: string
}

export interface ConversationCustomDataObject {
  /**
   * Client data
   */
  client_data: ConversationCustomDataClientDataObject
  /**
   * Conversation data
   */
  conversation_data: ConversationCustomDataConversationDataObject,
  /**
   * Request data
   */
  request_data: ConversationCustomDataRequestData,
  /**
   * Customer data
   */
  customer_data?: {
    id: number
  }
}

export interface ConversationCustomDataRequestData {
  id: number,
  /**
   * Conversation id (the whole chat in the channel)
   */
  conversation_id: number,
  /**
   * @hidden
   */
  start_sequence: number,
  /**
   * @hidden
   */
  end_sequence: any,
  /**
   * Time when the request was created
   */
  start_time: number,
  /**
   * Time when the agent started processing the request
   */
  handling_start_time: number,
  /**
   * Time when the request was closed
   */
  end_time: number,
  /**
   * Conversation is complete
   */
  completed: boolean,
  /**
   * Variables object
   */
  variables: ObjectType,
  /**
   * Tags
   */
  tags: { id: number }[]
}

export interface ConversationCustomDataClientDataObject {
  /**
   * Client id in the remote channel, external identifier
   */
  client_id: string
  /**
   * Client phone number
   */
  client_phone: string
  /**
   * Client avatar URL
   */
  client_avatar: string
  /**
   * Client display name
   */
  client_display_name: string
}

export interface ConversationCustomDataConversationDataObject {
  /**
   * Text of the last message
   */
  last_message_text: string
  /**
   * Time when the last message was sent
   */
  last_message_time: number
  /**
   * Channel from which the message was sent
   */
  channel_type: ChannelType
  /**
   * Sender of the last message
   */
  last_message_sender_type: string
  /**
   * Message is read
   */
  is_read: boolean
}

export interface QueueInfo {
  /**
   * Queue id
   */
  queue_id: number
  /**
   * @hidden
   */
  queue_name: string
}

export interface MessageCustomer {
  /**
   * Customer id
   */
  id: number,
  /**
   * Customer display name
   */
  customer_display_name: string,
  /**
   * Customer details
   */
  customer_details: string,
  /**
   * Customer photo URL
   */
  customer_photo: string,
  /**
   * Array of phone numbers
   */
  customer_phones: string[],
  /**
   * Array of the client's channels
   */
  customer_client_ids: MessageCustomerClientIds[],
  /**
   * Additional customer info
   */
  customer_external_id: string,
  /**
   * Array of email addresses
   */
  customer_emails: string[]
}

export interface MessageCustomerClientIds {
  /**
   * Client id in the remote channel, external identifier. Can be email, phone number, etc. depending on the channel type
   */
  client_id: string
  /**
   * Channel type
   */
  client_type: string
}

export interface IncomingRequestObject {
  /**
   * Request id
   */
  id: number
  /**
   * Conversation id (the whole chat in the channel)
   */
  conversation_id: number
  /**
   * @hidden
   */
  start_sequence: number
  /**
   * @hidden
   */
  end_sequence: number
  /**
   * Time when the request was created
   */
  start_time: number
  /**
   * Time when the agent started processing the request
   */
  handling_start_time: number
  /**
   * Time when the request was closed
   */
  end_time: number
  /**
   * Conversation is complete
   */
  completed: boolean
}

export interface MessageSender {
  /**
   * Message sender is a bot
   */
  is_bot: boolean
}

/**
 * @hidden
 */
export interface MessagePayloadItem {
  tags?: number[];
  type: string
  message_type?: string
  name?: string
  queue?: QueueInfo
  skills?: Array<SkillObject>,
  priority?: number,
  text?: string
  url?: string
  latitude?: number
  longitude?: number
  address?: string
  keys?: any
  file_name?: string
  file_size?: number
  replace?: boolean
  data?: string
}

export interface DataBase {
  /**
   * Function scope object
   */
  function: ObjectType,
  /**
   * Global scope object
   */
  global: ObjectType,
  /**
   * Conversation scope object
   */
  conversation: ObjectType
}

/**
 * @hidden
 */
export type DateBasePutParams = { name: string, scope: DataBaseType };

export type DataBaseType = 'function' | 'global' | 'conversation';

export type ChannelType =
  'telegram'
  | 'whatsapp-edna'
  | 'viber'
  | 'sms'
  | 'facebook'
  | 'vk'
  | 'odnoklassniki'
  | 'custom'
  | 'webchat';

/**
 * @hidden
 */
export interface ApiInstance {
  request<T, R = AxiosResponse<T>>(requestUrl: string, data: any): Promise<R>
}

export type DbResponse = { result: string };

// Vox doc do not support native type Record
export type ObjectType = {
  [key: string]: string
}

export type GetTagsResult = { id: number, tag_name: string | null }

export interface AvatarConfig {
  voxAccountId: string;
  avatarLogin: string;
  avatarPass: string;
  avatarId: string;
  callbackUri: string;
  utterance: string;
  conversationId: string;
  customData: unknown;
}
