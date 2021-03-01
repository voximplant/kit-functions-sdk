import { MessageConversation, MessageCustomer, MessagePayloadItem, MessageSender } from "./types";
export default class MessageObject {
    text: string;
    type: string;
    sender: MessageSender;
    conversation: MessageConversation;
    payload: Array<MessagePayloadItem>;
    customer: MessageCustomer;
    constructor(isBot?: boolean);
}
