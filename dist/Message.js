"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @hidden
 */
class Message {
    constructor(isBot = false) {
        this.id = null;
        this.text = null;
        this.type = null;
        this.sender = {
            is_bot: isBot
        };
        this.conversation = {
            id: null,
            uuid: null,
            client_id: null,
            custom_data: {
                conversation_data: {
                    last_message_text: null,
                    last_message_time: null,
                    channel_type: null,
                    last_message_sender_type: null,
                    is_read: null
                },
                client_data: {
                    client_id: null,
                    client_avatar: null,
                    client_display_name: null,
                    client_phone: null
                },
                request_data: {
                    id: null,
                    conversation_id: null,
                    start_sequence: null,
                    end_sequence: null,
                    start_time: null,
                    handling_start_time: null,
                    end_time: null,
                    completed: null,
                    variables: null,
                    tags: null
                }
            },
            current_status: null,
            current_request: {
                id: null,
                start_sequence: null,
                end_sequence: null,
                start_time: null,
                handling_start_time: null,
                end_time: null,
                completed: null,
                conversation_id: null
            },
            channel: null,
            customer_id: null
        };
        this.customer = {
            id: null,
            customer_display_name: null,
            customer_details: null,
            customer_photo: null,
            customer_phones: null,
            customer_client_ids: null,
            customer_external_id: null,
            customer_emails: null
        };
        this.payload = [];
        this.HasMedia = null;
    }
}
exports.default = Message;
