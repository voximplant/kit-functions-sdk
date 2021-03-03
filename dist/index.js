"use strict";
const axios_1 = require("axios");
const Api_1 = require("./Api");
const DB_1 = require("./DB");
const Message_1 = require("./Message");
const utils_1 = require("./utils");
class VoximplantKit {
    constructor(context, isTest = false) {
        this.requestData = {};
        this.accessToken = '';
        this.sessionAccessUrl = '';
        this.apiUrl = '';
        this.domain = '';
        this.functionId = 0;
        this.priority = 0;
        this.callHeaders = {};
        this.variables = {};
        this.call = null;
        this.skills = [];
        this.eventType = "webhook" /* webhook */;
        this.incomingMessage = new Message_1.default();
        this.replyMessage = new Message_1.default(true);
        this.isTest = isTest;
        this.http = axios_1.default;
        if (typeof context === 'undefined' || typeof context.request === "undefined") {
            context = {
                request: {
                    body: {},
                    headers: {}
                }
            };
        }
        // Store request data
        this.requestData = context.request.body;
        // Get event type
        this.eventType = utils_1.default.getHeaderValue(context, 'x-kit-event-type', "webhook" /* webhook */);
        // Get access token
        this.accessToken = utils_1.default.getHeaderValue(context, 'x-kit-access-token', '');
        // Get api url
        this.apiUrl = utils_1.default.getHeaderValue(context, 'x-kit-api-url', 'kitapi-eu.voximplant.com');
        // Get domain
        this.domain = utils_1.default.getHeaderValue(context, 'x-kit-domain', '');
        // Get function ID
        this.functionId = utils_1.default.getHeaderValue(context, 'x-kit-function-id', 0);
        // Get session access url
        this.sessionAccessUrl = utils_1.default.getHeaderValue(context, 'x-kit-session-access-url', '');
        // Store call data
        this.call = this.getCallData();
        // Store variables data
        this.variables = this.getVariablesFromContext();
        // Store skills data
        this.skills = this.getSkills();
        // Store Call headers
        this.callHeaders = this.getCallHeaders();
        this.api = new Api_1.default(this.domain, this.accessToken, this.isTest, this.apiUrl);
        this.DB = new DB_1.default(this.api);
        if (this.eventType === "incoming_message" /* incoming_message */) {
            this.incomingMessage = this.getIncomingMessage();
            this.replyMessage.type = this.requestData.type;
            this.replyMessage.sender.is_bot = true;
            this.replyMessage.conversation = utils_1.default.clone(this.requestData.conversation);
            this.replyMessage.payload.push({
                type: "properties",
                message_type: "text"
            });
        }
    }
    /**
     * load Databases
     */
    async loadDatabases() {
        const _DBs = [
            this.DB.getDB("function_" + this.functionId),
            this.DB.getDB("accountdb_" + this.domain)
        ];
        if (this.eventType === "incoming_message" /* incoming_message */) {
            _DBs.push(this.DB.getDB("conversation_" + this.incomingMessage.conversation.uuid));
        }
        await this.DB.getAllDB(_DBs);
    }
    /**
     * Get function response
     * @param data
     */
    getResponseBody(data) {
        if (this.eventType === "in_call_function" /* in_call_function */)
            return {
                "VARIABLES": this.variables,
                "SKILLS": this.skills
            };
        if (this.eventType === "incoming_message" /* incoming_message */) {
            const payloadIndex = this.replyMessage.payload.findIndex(item => {
                return item.type === "cmd" && item.name === "transfer_to_queue";
            });
            if (payloadIndex !== -1) {
                this.replyMessage.payload[payloadIndex].skills = this.skills;
                this.replyMessage.payload[payloadIndex].priority = this.priority;
            }
            return {
                text: this.replyMessage.text,
                payload: this.replyMessage.payload,
                variables: this.variables
            };
        }
        else
            return data;
    }
    /**
     * Get incoming message
     */
    getIncomingMessage() {
        return this.eventType === "incoming_message" /* incoming_message */ ? utils_1.default.clone(this.requestData) : null;
    }
    /**
     * Set auth token
     * @param token
     */
    setAccessToken(token) {
        // TODO why use this method?
        this.accessToken = token;
        this.api = new Api_1.default(this.domain, this.accessToken, this.isTest, this.apiUrl);
    }
    /**
     * Get Variable
     * @param name
     */
    getVariable(name) {
        return (typeof this.variables[name] !== "undefined") ? this.variables[name] : null;
    }
    /**
     * Set variable
     * @param name {String} - Variable name
     * @param value {String} - Variable value
     */
    setVariable(name, value) {
        this.variables[name] = `${value}`;
    }
    /**
     * Delete variable
     * @param name {String} - Variable name
     */
    deleteVariable(name) {
        delete this.variables[name];
    }
    getCallHeaders() {
        const headers = this.requestData.HEADERS;
        return headers ? utils_1.default.clone(headers) : null;
    }
    /**
     * Get all call data
     */
    getCallData() {
        const call = this.requestData.CALL;
        return (typeof call !== "undefined") ? utils_1.default.clone(call) : null;
    }
    /**
     * Get all variables
     */
    getVariablesFromContext() {
        var _a, _b, _c, _d, _e;
        let variables = {};
        if (this.eventType === "incoming_message" /* incoming_message */) {
            variables = ((_d = (_c = (_b = (_a = this.requestData) === null || _a === void 0 ? void 0 : _a.conversation) === null || _b === void 0 ? void 0 : _b.custom_data) === null || _c === void 0 ? void 0 : _c.request_data) === null || _d === void 0 ? void 0 : _d.variables) || {};
        }
        else if (this.eventType === "in_call_function" /* in_call_function */) {
            variables = ((_e = this.requestData) === null || _e === void 0 ? void 0 : _e.VARIABLES) || {};
        }
        return utils_1.default.clone(variables);
    }
    getVariables() {
        return utils_1.default.clone(this.variables);
    }
    /**
     * Get all skills
     */
    getSkills() {
        const skills = this.requestData.SKILLS;
        return (typeof skills !== "undefined") ? utils_1.default.clone(skills) : [];
    }
    /**
     * Set skill
     * @param name
     * @param level
     */
    setSkill(name, level) {
        const skillIndex = this.skills.findIndex(skill => {
            return skill.skill_name === name;
        });
        if (skillIndex === -1)
            this.skills.push({
                "skill_name": name,
                "level": level
            });
        else
            this.skills[skillIndex].level = level;
    }
    /**
     * Remove skill
     * @param name
     */
    removeSkill(name) {
        const skillIndex = this.skills.findIndex(skill => {
            return skill.skill_name === name;
        });
        if (skillIndex > -1) {
            this.skills.splice(skillIndex, 1);
        }
    }
    setPriority(value) {
        if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10) {
            this.priority = value;
        }
        else {
            console.warn(`The value ${value} cannot be set as a priority. An integer from 0 to 10 is expected`);
        }
        return this.priority;
    }
    getPriority() {
        return this.priority;
    }
    /**
     * Finish current request in conversation
     */
    finishRequest() {
        if (this.eventType !== "incoming_message" /* incoming_message */)
            return false;
        const payloadIndex = this.replyMessage.payload.findIndex(item => {
            return item.type === "cmd" && item.name === "finish_request";
        });
        if (payloadIndex === -1) {
            this.replyMessage.payload.push({
                type: "cmd",
                name: "finish_request"
            });
        }
        return true;
    }
    /**
     * Cancel finish current request in conversation
     */
    cancelFinishRequest() {
        const payloadIndex = this.replyMessage.payload.findIndex(item => {
            return item.type === "cmd" && item.name === "finish_request";
        });
        if (payloadIndex > -1) {
            this.replyMessage.payload.splice(payloadIndex, 1);
        }
        return true;
    }
    /**
     * Transfer to queue
     */
    transferToQueue(queue) {
        if (this.eventType !== "incoming_message" /* incoming_message */)
            return false;
        if (typeof queue.queue_id === "undefined")
            queue.queue_id = null;
        if (typeof queue.queue_name === "undefined")
            queue.queue_name = null;
        if (queue.queue_id === null && queue.queue_name === null)
            return false;
        const payloadIndex = this.replyMessage.payload.findIndex(item => {
            return item.type === "cmd" && item.name === "transfer_to_queue";
        });
        if (payloadIndex > -1) {
            this.replyMessage.payload[payloadIndex].queue = queue;
        }
        else {
            this.replyMessage.payload.push({
                type: "cmd",
                name: "transfer_to_queue",
                queue: queue,
                skills: []
            });
        }
        return true;
    }
    /**
     * Cancel transfer to queue
     */
    cancelTransferToQueue() {
        const payloadIndex = this.replyMessage.payload.findIndex(item => {
            return item.type === "cmd" && item.name === "transfer_to_queue";
        });
        if (payloadIndex > -1) {
            this.replyMessage.payload.splice(payloadIndex, 1);
        }
        return true;
    }
    /**
     * Save DB by scope name
     * @param type
     * @private
     */
    saveDb(type) {
        // TODO why use this method?
        let _dbName = null;
        if (type === "function") {
            _dbName = "function_" + this.functionId;
        }
        if (type === "global") {
            _dbName = "accountdb_" + this.domain;
        }
        if (type === "conversation" && this.eventType == "incoming_message" /* incoming_message */) {
            _dbName = "conversation_" + this.incomingMessage.conversation.uuid;
        }
        if (_dbName === null)
            return false;
        return this.DB.putDB(_dbName, type);
    }
    /**
     * Get value from DB by key
     * @param key
     * @param scope
     */
    dbGet(key, scope = "global") {
        return this.DB.getScopeValue(key, scope);
    }
    /**
     * Set value in DB by key
     * @param key
     * @param value
     * @param scope {DataBaseType}
     */
    dbSet(key, value, scope = "global") {
        this.DB.setScopeValue(key, value, scope);
    }
    /**
     * Get all DB scope by name
     * @param scope
     */
    dbGetAll(scope = "global") {
        return utils_1.default.clone(this.DB.getScopeAllValues(scope));
    }
    /**
     * Commit DB changes
     */
    async dbCommit() {
        const _DBs = [
            this.DB.putDB("function_" + this.functionId, 'function'),
            this.DB.putDB("accountdb_" + this.domain, 'global')
        ];
        if (this.eventType === "incoming_message" /* incoming_message */) {
            _DBs.push(this.DB.putDB("conversation_" + this.incomingMessage.conversation.uuid, 'conversation'));
        }
        this.DB.putAllDB(_DBs);
    }
    /**
     * Send SMS message
     * @param from
     * @param to
     * @param message
     */
    sendSMS(from, to, message) {
        return this.api.request("/v2/phone/sendSms", {
            source: from,
            destination: to,
            sms_body: message
        }).then(r => {
            return r.data;
        });
    }
    /**
     * Voximplant Kit API proxy
     * @param url {string} - Url address
     * @param data
     */
    apiProxy(url, data) {
        return this.api.request(url, data).then(r => {
            return r.data;
        });
    }
    /**
     * Add photo
     * ```js
     * module.exports = async function(context, callback) {
     *  const kit = new VoximplantKit(context);
     *  kit.addPhoto('https://your-srite.com/img/some-photo.png');
     *  callback(200, kit.getResponseBody());
     *}
     * ```
     * @param url {String} - Url address
     * @returns {Boolean}
     */
    addPhoto(url) {
        this.replyMessage.payload.push({
            type: "photo",
            url: url,
            file_name: "file",
            file_size: 123
        });
        return true;
    }
    /**
     * Get client version
     */
    version() {
        return "0.0.37";
    }
}
VoximplantKit.default = VoximplantKit;
module.exports = VoximplantKit;
