import { MessageConversation, MessageCustomer, MessagePayloadItem, MessageSender, MessageObject } from "./types";
/**
 * @hidden
 */
export default class Message implements MessageObject {
    id: number;
    text: string;
    type: string;
    sender: MessageSender;
    conversation: MessageConversation;
    payload: Array<MessagePayloadItem>;
    customer: MessageCustomer;
    HasMedia: boolean;
    constructor(isBot?: boolean);
}
