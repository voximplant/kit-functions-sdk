const callHeaders = {
  'x-kit-access-token': 'test_token',
  'x-kit-api-url': 'kitapi-eu.voximplant.com',
  'x-kit-domain': 'test',
  'x-kit-event-type': 'in_call_function',
  'x-kit-function-id': '61',
}

const callBody = {
  CALL: {
    phone_a: '79030000000',
    phone_b: '79030000001',
    record_url: '',
    attempt_num: 1,
    session_id: 1126281,
    id: 1734235,
    result_code: 200
  },
  SKILLS: [{skill_id: 11, level: 4, skill_name: 'skill_661605011533'}, {
    skill_id: 29,
    level: 5,
    skill_name: 'skill_661606995644'
  }],
  VARIABLES: {UTC: 'UTC', phone: '79030000001', my_var: 'Value for my var'},
  HEADERS: {},
  TAGS: [22, 55, 78, 93]
}

const messageHeaders = {
  'x-kit-access-token': 'test_token',
  'x-kit-api-url': 'kitapi-eu.voximplant.com',
  'x-kit-domain': 'test',
  'x-kit-event-type': 'incoming_message',
  'x-kit-function-id': '56',
}

const messageBody = {
  Id: '',
  text: 'Qwert',
  type: 'telegram',
  sender: {is_bot: false, Id: 0, SenderType: '', User: null},
  conversation: {
    id: 132,
    uuid: '44419364-16af-49dd-a571-ed5d71004acf',
    client_id: '379076605',
    custom_data: {
      client_data: {
        client_id: '379076605',
        client_phone: '',
        client_avatar: '',
        client_display_name: '\u0414\u043c\u0438\u0442\u0440\u0438\u0439'
      },
      conversation_data: {
        last_message_text: 'Qwert',
        last_message_time: 1618403041,
        channel_type: 'telegram',
        last_message_sender_type: 'client',
        last_message_sender_id: 311007,
        is_read: false,
        client_user_id: 311007
      },
      request_data: {
        id: 818,
        conversation_id: 132,
        start_sequence: 123,
        end_sequence: 157,
        start_time: '2021-03-31T08:49:45Z',
        handling_start_time: '2021-04-14T12:22:31.819713Z',
        end_time: '2021-04-14T12:22:31.819713Z',
        completed: false,
        variables: {},
        tags: [22, 55, 78, 93]
      }
    },
    current_status: 'processed_by_function',
    current_request: {
      id: 818,
      conversation_id: 132,
      start_sequence: 123,
      end_sequence: 153,
      start_time: '2021-03-31T08:49:45Z',
      handling_start_time: '2021-04-14T12:22:31.819713Z',
      end_time: '2021-04-14T12:22:31.819713Z',
      completed: false,
      variables: {}
    },
    channel: {
      id: 310,
      channel_uuid: 'ee07ab03-dce3-49b3-8bab-193a4a710dd6',
      account: {
        id: 31,
        name: 'nps-test-8f',
        account_id: 3818252,
        api_key: '00000000-0000-0000-0000-000000000000',
        domain_name: 'test'
      },
      channel_type: 'telegram',
      channel_settings: {
        api_key: '000000:0000000000000000000000',
        subject: '',
        url: '',
        salt: '',
        security_salt: ''
      },
      processing_method: 'function',
      processing_queue: {
        id: -1,
        acd_queue_id: 0,
        acd_queue_name: '',
        acd_establish_timeout_sec: 0,
        acd_reply_timeout_sec: 0,
        acd_client_timeout_sec: 0,
        AutoReplies: null
      },
      processing_function: 56,
      partner_id: 1,
      access_token: ''
    },
    customer_id: 2
  },
  payload: [{type: 'properties', sender_type: 'client'}, {type: 'button_data', data: 'Some data'}],
  customer: {
    id: 2,
    customer_display_name: '\u0414\u043c\u0438\u0442\u0440\u0438\u0439 (customer)',
    customer_details: '\u0422\u0435\u043a\u0441\u0442 \u0441 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u0435\u0439',
    customer_photo: '',
    customer_phones: ['+79030000000'],
    customer_client_ids: [{client_id: '379076605', client_type: 'telegram'}],
    customer_external_id: '',
    customer_emails: ['test@mail.com']
  },
  HasMedia: false
}

const avatarHeaders = {
  'x-kit-event-type': 'avatar_function'
}

const avatarBody = {
  conversation_id: "44419364-16af-49dd-a571-ed5d71004acf",
  response: "Я могу помочь вам записаться к специалисту или на процедуру, по остальным вопросам вам сможет подсказать наш оператор. Так чем могу помочь?",
  is_final: false,
  custom_data: "{ }"
}


const CallContext = {
  request: {
    headers: callHeaders,
    body: callBody,
  }
}
const MessageContext = {
  request: {
    headers: messageHeaders,
    body: messageBody
  }
}

const AvatarContext = {
  request: {
    headers: avatarHeaders,
    body: avatarBody
  }
}

module.exports = {
  MessageContext,
  CallContext,
  AvatarContext
}
