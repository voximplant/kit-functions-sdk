import axios, { AxiosInstance } from 'axios'
import api from "./api"

const EVENT_TYPES = {
  in_call_function: "in_call_function",
  incoming_message: "incoming_message",
  webhook: "webhook"
}

export interface CallObject {
  id: number
  result_code: number
  attempt_num: number
  session_id: string
  callerid: string
  destination: string
  display_name: string
  phone_a: string
  phone_b: string
  record_url: string
}

export interface ContextObject {
  request: RequestObject
}

export interface RequestObject {
  body: object
  headers: object
}

export interface SkillObject {
  skill_name: string
  level: number
}

export interface ResponseDataObject {
  VARIABLES: object
  SKILLS: Array<SkillObject>
}

export interface MessageConversation {
  id: number
  uuid: string
  client_id: string
  custom_data: ConversationCustomDataObject
  current_status: string
  current_request: IncomingRequestObject,
  channel: MessageConversationChannel,
  customer_id?: number,
}

export interface MessageConversationChannel {
  id: number
  channel_uuid: string,
  account: object,
  channel_type: string,// 'telegram'
  channel_settings: object,
  processing_method: string,
  processing_queue: object,
  processing_function: number,
  partner_id: number,
  access_token: string
}

export interface ConversationCustomDataObject {
  client_data: ConversationCustomDataClientDataObject
  conversation_data: ConversationCustomDataConversationDataObject
}

export interface ConversationCustomDataClientDataObject {
  client_id: string
  client_phone: string
  client_avatar: string
  client_display_name: string
}

export interface ConversationCustomDataConversationDataObject {
  last_message_text: string
  last_message_time: number
  channel_type: string
  last_message_sender_type: string
  is_read: boolean
}

export interface QueueInfo {
  queue_id: number
  queue_name: string
}

export interface MessageObject {
  text: string
  type: string
  sender: MessageSender
  conversation: MessageConversation
  payload: Array<MessagePayloadItem>,
  customer: MessageCustomer
}

export interface MessageCustomer {
  id: number,
  customer_display_name: string,
  customer_details: string,
  customer_photo: string,
  customer_phones: string[],
  customer_client_ids: MessageCustomerClientIds[],
  customer_external_id: string,
  customer_emails: string[]
}

export interface MessageCustomerClientIds {
  client_id: string
  client_type: string
}

export interface IncomingMessageObject {
  text: string
  type: string
  conversation_uuid: string
  client_data: ConversationCustomDataClientDataObject
  conversation_data: ConversationCustomDataConversationDataObject
  current_request: IncomingRequestObject
}

export interface IncomingRequestObject {
  id: number
  conversation_id: number
  start_sequence: number
  end_sequence: number
  start_time: number
  handling_start_time: number
  end_time: number
  completed: boolean
}

export interface MessageSenderObject {
  client_id: string
  client_phone: string
  client_avatar: string
  client_display_name: string
}

export interface MessageSender {
  is_bot: boolean
}

export interface MessagePayloadItem {
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
}

export default class VoximplantKit {
  private isTest: boolean = false
  private requestData: any = {}
  private responseData: ResponseDataObject = {
    VARIABLES: {},
    SKILLS: []
  }
  // private responseMessageData:MessageObject = {}

  private accessToken: string = null
  private sessionAccessUrl: string = null
  private apiUrl: string = null
  private domain: string = null
  private functionId: number = null

  eventType: string = EVENT_TYPES.webhook
  call: CallObject = null
  variables: object = {}
  headers: object = {}
  skills: Array<SkillObject> = []
  private priority: number = 0;

  incomingMessage: MessageObject = {
    text: null,
    type: null,
    sender: {
      is_bot: null
    },
    conversation: {
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
    },
    customer: {
      id: null,
      customer_display_name: null,
      customer_details: null,
      customer_photo: null,
      customer_phones: null,
      customer_client_ids: null,
      customer_external_id: null,
      customer_emails: null
    },
    payload: []
  }
  replyMessage: MessageObject = {
    text: null,
    type: null,
    sender: {
      is_bot: true
    },
    conversation: {
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
    },
    customer: {
      id: null,
      customer_display_name: null,
      customer_details: null,
      customer_photo: null,
      customer_phones: null,
      customer_client_ids: null,
      customer_external_id: null,
      customer_emails: null
    },
    payload: []
  }
  // maxSkillLevel:number = 5

  private conversationDB: any = {}
  private functionDB: any = {}
  private accountDB: any = {}
  private db: any = {}

  api: any
  http: AxiosInstance

  constructor(context: ContextObject, isTest: boolean = false) {
    this.isTest = isTest
    this.http = axios

    if (typeof context === 'undefined' || typeof context.request === "undefined") {
      context = {
        request: {
          body: {},
          headers: {}
        }
      }
    }

    // Store request data
    this.requestData = context.request.body
    // Get event type
    this.eventType = (typeof context.request.headers["x-kit-event-type"] !== "undefined") ? context.request.headers["x-kit-event-type"] : EVENT_TYPES.webhook
    // Get access token
    this.accessToken = (typeof context.request.headers["x-kit-access-token"] !== "undefined") ? context.request.headers["x-kit-access-token"] : ""
    // Get api url
    this.apiUrl = (typeof context.request.headers["x-kit-api-url"] !== "undefined") ? context.request.headers["x-kit-api-url"] : "kitapi-eu.voximplant.com"
    // Get domain
    this.domain = (typeof context.request.headers["x-kit-domain"] !== "undefined") ? context.request.headers["x-kit-domain"] : "annaclover"
    // Get function ID
    this.functionId = (typeof context.request.headers["x-kit-function-id"] !== "undefined") ? context.request.headers["x-kit-function-id"] : 88
    // Get session access url
    this.sessionAccessUrl = (typeof context.request.headers["x-kit-session-access-url"] !== "undefined") ? context.request.headers["x-kit-session-access-url"] : ""
    // Store call data
    this.call = this.getCallData()
    // Store variables data
    this.variables = this.getVariables()
    // Store skills data
    this.skills = this.getSkills()

    this.responseData = {
      VARIABLES: {},
      SKILLS: []
    }

    this.api = new api(this.domain, this.accessToken, this.isTest, this.apiUrl)

    if (this.eventType === EVENT_TYPES.incoming_message) {
      this.incomingMessage = this.getIncomingMessage()
      this.replyMessage.type = this.requestData.type
      this.replyMessage.sender.is_bot = true
      this.replyMessage.conversation = this.requestData.conversation
      this.replyMessage.payload.push({
        type: "properties",
        message_type: "text"
      });
    }
  }

  // load Databases
  async loadDatabases() {
    let _this = this
    let _DBs = [
      this.loadDB("function_" + this.functionId),
      this.loadDB("accountdb_" + this.domain)
    ];

    if (this.eventType === EVENT_TYPES.incoming_message) {
      _DBs.push(this.loadDB("conversation_" + this.incomingMessage.conversation.uuid))
    }

    await axios.all(_DBs).then(axios.spread((func, acc, conv?) => {
      _this.functionDB = (typeof func !== "undefined" && typeof func.result !== "undefined" && func.result !== null) ? JSON.parse(func.result) : {}
      _this.accountDB = (typeof acc !== "undefined" && typeof acc.result !== "undefined" && acc.result !== null) ? JSON.parse(acc.result) : {}
      _this.conversationDB = (typeof conv !== "undefined" && typeof acc.result !== "undefined" && acc.result !== null) ? JSON.parse(conv.result) : {}
      _this.db = {
        function: _this.functionDB,
        global: _this.accountDB,
        conversation: _this.conversationDB
      }
    }))
  }

  setPriority(value: number) {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10) {
      this.priority = value;
    } else {
      console.warn(`The value ${value} cannot be set as a priority. An integer from 0 to 10 is expected`)
    }
    return this.priority;
  }

  getPriority() {
    return this.priority;
  }

  // Get function response
  getResponseBody(data: any) {
    if (this.eventType === EVENT_TYPES.in_call_function)
      return {
        "VARIABLES": this.variables,
        "SKILLS": this.skills
      }
    if (this.eventType === EVENT_TYPES.incoming_message) {
      const payloadIndex = this.replyMessage.payload.findIndex(item => {
        return item.type === "cmd" && item.name === "transfer_to_queue"
      })

      if (payloadIndex !== -1) {
        this.replyMessage.payload[payloadIndex].skills = this.skills;
        this.replyMessage.payload[payloadIndex].priority = this.priority;
      }

      return {
        text: this.replyMessage.text,
        payload: this.replyMessage.payload
      }
    } else
      return data
  }

  // Get incoming message
  getIncomingMessage(): MessageObject {
    return this.requestData
  }

  // Set auth token
  setAccessToken(token) {
    this.accessToken = token
  }

  // Get Variable
  getVariable(name: string) {
    return (typeof this.variables[name] !== "undefined") ? this.variables[name] : null
  }

  // Set variable
  setVariable(name, value) {
    this.variables[name] = value
  }

  // Get all call data
  getCallData() {
    return (typeof this.requestData.CALL !== "undefined") ? this.requestData.CALL : null
  }

  // Get all variables
  getVariables() {
    return (typeof this.requestData.VARIABLES !== "undefined") ? this.requestData.VARIABLES : {}
  }

  // Get all skills
  getSkills() {
    return (typeof this.requestData.SKILLS !== "undefined") ? this.requestData.SKILLS : []
  }

  // Set skill
  setSkill(name: string, level: number) {
    const skillIndex = this.skills.findIndex(skill => {
      return skill.skill_name === name
    })
    if (skillIndex === -1) this.skills.push({
      "skill_name": name,
      "level": level
    })
    else this.skills[skillIndex].level = level
  }

  // Remove skill
  removeSkill(name: string) {
    const skillIndex = this.skills.findIndex(skill => {
      return skill.skill_name === name
    })
    if (skillIndex > -1) {
      this.skills.splice(skillIndex, 1)
    }
  }

  // Finish current request in conversation
  finishRequest() {
    if (this.eventType !== EVENT_TYPES.incoming_message) return false
    const payloadIndex = this.replyMessage.payload.findIndex(item => {
      return item.type === "cmd" && item.name === "finish_request"
    })
    if (payloadIndex === -1) {
      this.replyMessage.payload.push({
        type: "cmd",
        name: "finish_request"
      })
    }
    return true
  }

  // Cancel finish current request in conversation
  cancelFinishRequest() {
    const payloadIndex = this.replyMessage.payload.findIndex(item => {
      return item.type === "cmd" && item.name === "finish_request"
    })
    if (payloadIndex > -1) {
      this.replyMessage.payload.splice(payloadIndex, 1)
    }

    return true
  }

  // Transfer to queue
  transferToQueue(queue: QueueInfo) {
    if (this.eventType !== EVENT_TYPES.incoming_message) return false

    if (typeof queue.queue_id === "undefined") queue.queue_id = null;
    if (typeof queue.queue_name === "undefined") queue.queue_name = null;

    if (queue.queue_id === null && queue.queue_name === null) return false

    const payloadIndex = this.replyMessage.payload.findIndex(item => {
      return item.type === "cmd" && item.name === "transfer_to_queue"
    })
    if (payloadIndex > -1) {
      this.replyMessage.payload[payloadIndex].queue = queue
    } else {
      this.replyMessage.payload.push({
        type: "cmd",
        name: "transfer_to_queue",
        queue: queue,
        skills: []
      })
    }

    return true
  }

  // Cancel transfer to queue
  cancelTransferToQueue() {
    const payloadIndex = this.replyMessage.payload.findIndex(item => {
      return item.type === "cmd" && item.name === "transfer_to_queue"
    })
    if (payloadIndex > -1) {
      this.replyMessage.payload.splice(payloadIndex, 1)
    }

    return true
  }

  private loadDB(db_name: string) {
    return this.api.request("/v2/kv/get", {
      key: db_name
    }).then((response) => {
      return response.data
    }).catch(e => {
      return {}
    })
  }

  private saveDB(db_name: string, value: string) {
    return this.api.request("/v2/kv/put", {
      key: db_name,
      value: value,
      ttl: -1
    }).then((response) => {
      return response.data
    }).catch(e => {
      return {}
    })
  }

  // Save DB by scope name
  private saveDb(type: string) {
    let _dbName = null
    let _dbValue = null

    if (type === "function") {
      _dbName = "function_" + this.functionId
      _dbValue = this.functionDB
    }

    if (type === "account") {
      _dbName = "accountdb_" + this.domain
      _dbValue = this.accountDB
    }

    if (type === "conversation" && this.eventType == EVENT_TYPES.incoming_message) {
      _dbName = "conversation_" + this.incomingMessage.conversation.uuid
      _dbValue = this.conversationDB
    }

    if (_dbName === null) return false

    return this.saveDB(_dbName, JSON.stringify(_dbValue))
  }

  // Get value from DB by key
  dbGet(key: string, scope: string = "global"): any {
    return this.db[scope]
  }

  // Set value in DB by key
  dbSet(key: string, value: any, scope: string = "global"): void {
    this.db[scope][key] = value
  }

  // Get all DB scope by name
  dbGetAll(scope: string = "global") {
    return typeof this.db[scope] !== "undefined" ? this.db[scope] : null
  }

  // Commit DB chnges
  async dbCommit() {
    let _this = this
    let _DBs = [
      this.saveDB("function_" + this.functionId, JSON.stringify(this.db.function)),
      this.saveDB("accountdb_" + this.domain, JSON.stringify(this.db.global))
    ];

    if (this.eventType === EVENT_TYPES.incoming_message) {
      _DBs.push(this.saveDB("conversation_" + this.incomingMessage.conversation.uuid, JSON.stringify(this.db.conversation)))
    }

    await axios.all(_DBs).then(axios.spread((func, acc, conv?) => {
      console.log("result", func, acc, conv)
    }))
  }

  // Send SMS message
  sendSMS(from: string, to: string, message: string) {
    return this.api.request("/v2/phone/sendSms", {
      source: from,
      destination: to,
      sms_body: message
    }).then(r => {
      return r.data
    })
  }

  // Voximplant Kit API proxy
  apiProxy(url: string, data: any) {
    return this.api.request(url, data).then(r => {
      return r.data
    })
  }

  // Add photo
  addPhoto(url) {
    this.replyMessage.payload.push({
      type: "photo",
      url: url,
      file_name: "file",
      file_size: 123
    })

    return true
  }

  // Client version
  version() {
    return "0.0.30"
  }
}
