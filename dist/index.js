"use strict";
const axios_1 = require("axios");
const Api_1 = require("./Api");
const DB_1 = require("./DB");
const Message_1 = require("./Message");
const utils_1 = require("./utils");
const Avatar_1 = require("./Avatar");
utils_1.default.getEnv();
class VoximplantKit {
    /**
     * Voximplant Kit class, a middleware for working with functions.
     * ```js
     * module.exports = async function(context, callback) {
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Some code
     *  console.log(Date.now());
     *  // End of function
     *  callback(200, kit.getResponseBody());
     *}
     * ```
     */
    constructor(context) {
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
        this.messageCustomData = [];
        this.incomingMessage = new Message_1.default();
        this.replyMessage = new Message_1.default(true);
        this.http = axios_1.default;
        if (typeof context === 'undefined' || !((context === null || context === void 0 ? void 0 : context.request) && context.request.body && context.request.headers)) {
            const err = new TypeError('context parameter is required');
            err.stack = '';
            throw err;
        }
        // Store request data
        this.requestData = context.request.body;
        // Get event type
        this.eventType = utils_1.default.getHeaderValue(context, 'x-kit-event-type', "webhook" /* webhook */);
        // Get access token
        this.accessToken = utils_1.default.getHeaderValue(context, 'x-kit-access-token', 'test');
        // Get api url
        this.apiUrl = utils_1.default.getHeaderValue(context, 'x-kit-api-url', 'kitapi-eu.voximplant.com');
        // Get domain
        this.domain = utils_1.default.getHeaderValue(context, 'x-kit-domain', 'test');
        // Get function ID
        this.functionId = utils_1.default.getHeaderValue(context, 'x-kit-function-id', 0);
        // Get session access url
        this.sessionAccessUrl = utils_1.default.getHeaderValue(context, 'x-kit-session-access-url', '');
        // Store call data
        this.call = this.getRequestDataProperty('CALL');
        // Store Call headers
        this.callHeaders = this.getRequestDataProperty('HEADERS');
        // Store variables data
        this.variables = this.getRequestDataVariables();
        // Store skills data
        this.skills = this.getRequestDataProperty('SKILLS', []); //this.getSkills()
        this.tags = this.getRequestDataTags();
        this.avatarReply = this.getRequestDataAvatar();
        this.api = new Api_1.default(this.domain, this.accessToken, this.apiUrl);
        this.DB = new DB_1.default(this.api);
        this.isTagsReplace = false;
        const avatarHeaders = {
            'x-kit-access-token': utils_1.default.getHeaderValue(context, 'x-kit-access-token', ''),
            'x-kit-api-url': utils_1.default.getHeaderValue(context, 'x-kit-api-url', ''),
            'x-kit-domain': utils_1.default.getHeaderValue(context, 'x-kit-domain', ''),
        };
        const avatarApiDomain = this.getEnvVariable('CUSTOM_AVATAR_API_DOMAIN') || this.getEnvVariable('KIT_AVATAR_API_DOMAIN');
        const kitImUrl = this.getEnvVariable('KIT_IM_URL');
        this.avatar = new Avatar_1.default(avatarApiDomain, kitImUrl, avatarHeaders);
        if (this.isMessage()) {
            this.incomingMessage = utils_1.default.clone(this.requestData);
            this.replyMessage.type = this.requestData.type;
            this.replyMessage.sender.is_bot = true;
            this.replyMessage.conversation = utils_1.default.clone(this.requestData.conversation);
        }
        if (this.isAvatar()) {
            const requestData = this.requestData;
            this.replyMessage.text = requestData.response;
            this.avatar.setResponseData(requestData);
        }
        if (this.isMessage() || this.isAvatar()) {
            this.replyMessage.payload.push({
                type: "properties",
                message_type: "text"
            });
        }
    }
    /**
     * Get the conversation uuid. Only applicable when called from a channel or when calling the function as a callbackUri in the sendMessageToAvatar method.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  if (kit.isMessage() || kit.isAvatar()) {
     *    const uuid = kit.getConversationUuid();
     *    //... do something
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getConversationUuid() {
        if (this.isMessage()) {
            let _messageObject = this.getIncomingMessage();
            return _messageObject && _messageObject.conversation ? _messageObject.conversation.uuid : null;
        }
        if (this.isAvatar()) {
            return this.getRequestDataProperty('chat_id', null) || this.getRequestDataProperty('conversation_id', null);
        }
        return null;
    }
    /**
     * Get the function URI by its id.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  const uri = kit.getFunctionUriById(31);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getFunctionUriById(id) {
        try {
            const urls = JSON.parse(this.getEnvVariable('KIT_FUNC_URLS'));
            if (id in urls) {
                return urls[id];
            }
            return null;
        }
        catch (err) {
            return null;
        }
    }
    // TODO combine methods getRequestDataProperty/getRequestDataVariables/getRequestDataTags
    getRequestDataProperty(name, defaultProp = {}) {
        var _a;
        const prop = (_a = this.requestData) === null || _a === void 0 ? void 0 : _a[name];
        return prop ? utils_1.default.clone(prop) : defaultProp;
    }
    getRequestDataVariables() {
        var _a, _b, _c, _d, _e;
        let variables = {};
        if (this.isMessage()) {
            variables = ((_d = (_c = (_b = (_a = this.requestData) === null || _a === void 0 ? void 0 : _a.conversation) === null || _b === void 0 ? void 0 : _b.custom_data) === null || _c === void 0 ? void 0 : _c.request_data) === null || _d === void 0 ? void 0 : _d.variables) || {};
        }
        else if (this.isCall()) {
            variables = ((_e = this.requestData) === null || _e === void 0 ? void 0 : _e.VARIABLES) || {};
        }
        return utils_1.default.clone(variables);
    }
    getRequestDataTags() {
        var _a, _b, _c, _d, _e;
        let tags = [];
        if (this.isMessage()) {
            tags = ((_d = (_c = (_b = (_a = this.requestData) === null || _a === void 0 ? void 0 : _a.conversation) === null || _b === void 0 ? void 0 : _b.custom_data) === null || _c === void 0 ? void 0 : _c.request_data) === null || _d === void 0 ? void 0 : _d.tags) || [];
        }
        else if (this.isCall()) {
            tags = ((_e = this.requestData) === null || _e === void 0 ? void 0 : _e.TAGS) || [];
        }
        return tags;
    }
    getRequestDataAvatar() {
        var _a, _b, _c;
        const data = this.getRequestDataProperty('VOICE_AVATAR_REPLY', null);
        if (this.isCall() && data) {
            return {
                is_final: data.isFinal,
                response: data.utterance,
                custom_data: (_a = data.customData) !== null && _a !== void 0 ? _a : null,
                current_state: (_b = data.currentState) !== null && _b !== void 0 ? _b : null,
                next_state: (_c = data.nextState) !== null && _c !== void 0 ? _c : null
            };
        }
        return null;
    }
    findPayloadIndex(name, type = 'cmd') {
        return this.replyMessage.payload.findIndex(item => {
            return item.type === type && item.name === name;
        });
    }
    /**
     * Loads the databases available in the scope.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connect available databases
     *    await kit.loadDatabases();
     *    // Read contents from the global scope
     *    const global_scope = kit.dbGetAll('global');
     *    console.log(global_scope)
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    async loadDatabases() {
        const names = [
            'function_' + this.functionId,
            'accountdb_' + this.domain,
        ];
        if (this.isMessage()) {
            names.push('conversation_' + this.incomingMessage.conversation.uuid);
        }
        return await this.DB.getAllDB(names);
    }
    _getVariables() {
        const variables = {};
        // Converting the type of variables to a string
        for (let key in this.variables) {
            if (this.variables.hasOwnProperty(key)) {
                try {
                    variables[key] = typeof this.variables[key] === 'object' ? JSON.stringify(this.variables[key]) : this.variables[key] + '';
                }
                catch (e) {
                    variables[key] = '';
                }
            }
        }
        return variables;
    }
    /**
     * Gets a message object.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  if (kit.isMessage() || kit.isAvatar()) {
     *    const messageObject = kit.getMessageObject();
     *    // ...do something
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getMessageObject() {
        if (this.isMessage() || this.isAvatar()) {
            const variables = this._getVariables();
            const queuePayloadIndex = this.findPayloadIndex('transfer_to_queue');
            const tagsPayloadIndex = this.findPayloadIndex('bind_tags');
            if (this.messageCustomData.length && (this.isMessage() || this.isAvatar())) {
                this.replyMessage.payload = [...this.replyMessage.payload, ...this.messageCustomData];
            }
            if (queuePayloadIndex !== -1) {
                this.replyMessage.payload[queuePayloadIndex].skills = this.skills;
                this.replyMessage.payload[queuePayloadIndex].priority = this.priority;
            }
            if (tagsPayloadIndex !== -1) {
                const tagsPayload = this.replyMessage.payload[tagsPayloadIndex];
                tagsPayload.tags = Array.from(new Set(this.tags));
                tagsPayload.replace = this.isTagsReplace;
            }
            return {
                text: this.replyMessage.text,
                payload: utils_1.default.clone(this.replyMessage.payload),
                variables: variables
            };
        }
        else {
            return {};
        }
    }
    /**
     * Gets a function response. Needs to be called at the end of each function.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getResponseBody() {
        const variables = this._getVariables();
        if (this.isCall()) {
            return {
                "VARIABLES": variables,
                "SKILLS": this.skills,
                "TAGS": Array.from(new Set(this.tags))
            };
        }
        else if (this.isMessage()) {
            return this.getMessageObject();
        }
        else {
            return;
        }
    }
    /**
     * Gets an incoming message.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Check if the function is called from a channel
     *  if (kit.isMessage()) {
     *    // Get text from an incoming message
     *    const message = kit.getIncomingMessage();
     *    console.log(message.text);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getIncomingMessage() {
        return this.isMessage() ? utils_1.default.clone(this.incomingMessage) : null;
    }
    /**
     * Sets a reply message text.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Check if the function is called from a channel
     *  if (kit.isMessage()) {
     *    // Get text from an incoming message
     *    const message = kit.getIncomingMessage();
     *    console.log(message.text);
     *    // Set text of the reply
     *    kit.setReplyMessageText('you wrote ' + message.text);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param text {string} - Reply text
     */
    setReplyMessageText(text) {
        if (typeof text === "string") {
            this.replyMessage.text = text;
            return true;
        }
        return false;
    }
    /**
     * The function is called from a call.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    console.log('This function is called from the call')
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    isCall() {
        return this.eventType === "in_call_function" /* in_call_function */;
    }
    /**
     * The function is called from a message.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isMessage()) {
     *    console.log('This function is called from the channel');
     *    const message = kit.getIncomingMessage();
     *    //...
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    isMessage() {
        return this.eventType === "incoming_message" /* incoming_message */;
    }
    /**
     * The function is called by the avatar.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isAvatar()) {
     *    //...do something
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    isAvatar() {
        return this.eventType === "avatar_function" /* avatar_function */;
    }
    /**
     * Gets a variable by name.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  const my_var = kit.getVariable('my_var');
     *  if (my_var) {
     *    console.log(my_var);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name {string} - Variable name
     */
    getVariable(name) {
        return (typeof name === 'string' && typeof this.variables[name] !== "undefined") ? this.variables[name] : null;
    }
    /**
     * Adds a variable or updates it if the variable name already exists.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  kit.setVariable('my_var', 'some_value');
     *  console.log(kit.getVariable('my_var'));
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name {string} - Variable name
     * @param value {any} - Variable value
     */
    setVariable(name, value) {
        if (typeof name === 'string') {
            this.variables[name] = value;
            return true;
        }
        return false;
    }
    /**
     * Deletes a variable by name.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  kit.deleteVariable('my_var');
     *  // Console will print null
     *  console.log(kit.getVariable('my_var'));
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name {string} - Variable name
     */
    deleteVariable(name) {
        if (typeof name === 'string' && name in this.variables) {
            delete this.variables[name];
            return true;
        }
        return false;
    }
    /**
     * Gets call headers.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    const headers = kit.getCallHeaders();
     *    console.log(headers);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getCallHeaders() {
        return this.isCall() ? utils_1.default.clone(this.callHeaders) : null;
    }
    /**
     * Gets all call data.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    const call = kit.getCallData();
     *    // Get the phone number from which the call is made
     *    console.log(call.phone_a);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getCallData() {
        return this.isCall() ? utils_1.default.clone(this.call) : null;
    }
    /**
     * Gets all variables.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  const all_vars = kit.getVariables();
     *  console.log(all_vars);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getVariables() {
        return utils_1.default.clone(this.variables);
    }
    /**
     * Gets all skills.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isCall()) {
     *    const all_skills = kit.getSkills();
     *    console.log('All skills:', all_skills);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getSkills() {
        return utils_1.default.clone(this.skills);
    }
    /**
     * Adds a skill or updates it if the skill id already exists.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    kit.setSkill({skill_id: 234, level: 5});
     *  } else if (kit.isMessage()) {
     *    kit.setSkill({skill_id: 35, level: 3});
     *    kit.transferToQueue({queue_id: 72});
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    setSkill(skill) {
        if (!('skill_id' in skill)) {
            console.warn('setSkill: The id parameter is required');
            return false;
        }
        if (!('level' in skill)) {
            console.warn('setSkill: The level parameter is required');
            return false;
        }
        if (!Number.isInteger(skill.skill_id) || !Number.isInteger(skill.level))
            return false;
        if (skill.skill_id < 0) {
            console.warn('setSkill: The skill_id parameter must be a positive integer');
            return false;
        }
        if (skill.level < 1 || skill.level > 5) {
            console.warn('setSkill: The level parameter must be an integer from 1 to 5');
            return false;
        }
        const skillIndex = this.skills.findIndex(item => {
            return item.skill_id === skill.skill_id;
        });
        if (skillIndex === -1)
            this.skills.push({
                "skill_id": skill.skill_id,
                "level": skill.level
            });
        else
            this.skills[skillIndex].level = skill.level;
        return true;
    }
    /**
     * Removes a skill by id.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  kit.removeSkill(234);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param id {Number} - Name of the skill to remove
     */
    removeSkill(id) {
        const skillIndex = this.skills.findIndex(skill => {
            return skill.skill_id === id;
        });
        if (skillIndex > -1) {
            this.skills.splice(skillIndex, 1);
            return true;
        }
        return false;
    }
    /**
     * Sets the call priority. The higher the priority, the less time a client will wait for the operator's response.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer a client to the queue
     *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
     *  // Set the highest priority
     *  kit.setPriority(10);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param value {number} - Priority value, from 0 to 10
     */
    setPriority(value) {
        if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10) {
            this.priority = value;
            return true;
        }
        else {
            console.warn(`${value} cannot be set as a priority value. An integer from 0 to 10 is expected`);
            return false;
        }
    }
    /**
     * Gets call priorities.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Return a number from 0 to 10
     *  const priority = kit.getPriority();
     *  if (priority === 10) {
     *    // Something to do
     *  } else if (priority === 5) {
     *    // Something to do
     *  } else {
     *    // Something to do
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getPriority() {
        return this.priority;
    }
    /**
     * Closes the client's request.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isMessage()) {
     *    kit.finishRequest();
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    finishRequest() {
        if (!(this.isMessage() || this.isAvatar()))
            return false;
        const payloadIndex = this.findPayloadIndex('finish_request');
        if (payloadIndex === -1) {
            this.replyMessage.payload.push({
                type: "cmd",
                name: "finish_request"
            });
        }
        return true;
    }
    /**
     * Reopens the client's request.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isMessage()) {
     *    kit.finishRequest();
     *  }
     *  // ...
     *  // Сondition for reopening
     *  const shouldCancel = true;
     *  if (shouldCancel) {
     *    kit.cancelFinishRequest();
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    cancelFinishRequest() {
        const payloadIndex = this.findPayloadIndex('finish_request');
        if (payloadIndex > -1) {
            this.replyMessage.payload.splice(payloadIndex, 1);
        }
        return true;
    }
    /**
     * Transfers a client to the queue.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer a client to the queue
     *  kit.transferToQueue({queue_id: 82});
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    transferToQueue(queue) {
        if (!(this.isMessage() || this.isAvatar()))
            return false;
        this.cancelTransferToUser();
        if (typeof queue.queue_id === "undefined" || !Number.isInteger(queue.queue_id))
            queue.queue_id = null;
        if (typeof queue.queue_name === "undefined" || typeof queue.queue_name !== "string")
            queue.queue_name = null;
        if (queue.queue_id === null && queue.queue_name === null)
            return false;
        const payloadIndex = this.findPayloadIndex('transfer_to_queue');
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
     * Transfers a client to the user. Only for text channels and Avatar.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isMessage() || this.isAvatar()) {
     *    // Use user_id or user_email.
     *    kit.transferToUser({user_id: 12});
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    transferToUser(user) {
        if (!(this.isMessage() || this.isAvatar()))
            return false;
        this.cancelTransferToQueue();
        if (typeof user.user_id === "undefined" || !Number.isInteger(user.user_id))
            user.user_id = null;
        if (typeof user.user_email === "undefined" || typeof user.user_email !== "string")
            user.user_email = null;
        if (user.user_id === null && user.user_email === null)
            return false;
        const payloadIndex = this.findPayloadIndex('transfer_to_user');
        if (payloadIndex > -1) {
            this.replyMessage.payload[payloadIndex].user = user;
        }
        else {
            this.replyMessage.payload.push({
                type: "cmd",
                name: "transfer_to_user",
                user: user
            });
        }
        return true;
    }
    /**
     * Cancels transferring a client to the queue.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer a client to the queue
     *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
     *  //...
     *  // Condition for canceling the transfer to the queue
     *  const shouldCancel = true;
     *  if (shouldCancel) {
     *    kit.cancelTransferToQueue();
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    cancelTransferToQueue() {
        const payloadIndex = this.findPayloadIndex('transfer_to_queue');
        if (payloadIndex > -1) {
            this.replyMessage.payload.splice(payloadIndex, 1);
        }
        return true;
    }
    /**
     * Cancels transferring a client to the user.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer a client to the queue
     *  kit.transferToUser({user_id: 12});
     *  //...
     *  // Condition for canceling the transfer to the queue
     *  const shouldCancel = true;
     *  if (shouldCancel) {
     *    kit.cancelTransferToUser();
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    cancelTransferToUser() {
        const payloadIndex = this.findPayloadIndex('transfer_to_user');
        if (payloadIndex > -1) {
            this.replyMessage.payload.splice(payloadIndex, 1);
        }
        return true;
    }
    /**
     * Gets a value from the database scope by key. Available only after loadDatabases() execution.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connect available databases
     *    await kit.loadDatabases();
     *    // Get the value from the function scope by key
     *    const _test = kit.dbGet('test_key', 'function')
     *    console.log(_test);
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param key {string} - Key
     * @param scope {DataBaseType} - Database scope
     */
    dbGet(key, scope = "global") {
        return this.DB.getScopeValue(key, scope);
    }
    /**
     * Adds a value to the database scope or updates it if the key already exists. Available only after loadDatabases() execution.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connect available databases
     *    await kit.loadDatabases();
     *    // Get a value from the function scope by key
     *    const _test = kit.dbGet('test_key', 'function')
     *    // If there is no data
     *    if (_test === null) {
     *      kit.dbSet('test_key', 'Hello world!!!', 'function');
     *    }
     *    // Write changes to the database
     *    await kit.dbCommit();
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param key {string} - Key
     * @param value {any} - Value
     * @param scope {DataBaseType} - Database scope
     */
    dbSet(key, value, scope = "global") {
        return this.DB.setScopeValue(key, value, scope);
    }
    /**
     * Deletes a value from the database scope, if the key already exists. Available only after laodDatabase(). execution.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connect available databases
     *    await kit.loadDatabases();
     *    // Delete a value from the function scope by key
     *    kit.dbDelete('test_key', 'function')
     *    // Write changes to the database
     *   await kit.dbCommit();
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param key {string} - Key
     * @param scope {DataBaseType} - Database scope
     */
    dbDelete(key, scope) {
        return this.DB.deleteScopeValue(key, scope);
    }
    /**
     * Gets the whole database scope by name. Available only after loadDatabases() execution.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connect available databases
     *    await kit.loadDatabases();
     *    // Read contents from the global scope
     *    const global_scope = kit.dbGetAll('global');
     *    console.log(global_scope)
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param scope {DataBaseType} - Database scope
     */
    dbGetAll(scope = "global") {
        return utils_1.default.clone(this.DB.getScopeAllValues(scope));
    }
    /**
     * Adds changes to the database. Available only after loadDatabases() execution.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connect available databases
     *    await kit.loadDatabases();
     *    // Get a value from the function scope by key
     *    const _test = kit.dbGet('test_key', 'function')
     *    // If there is no data
     *    if (_test === null) {
     *      kit.dbSet('test_key', 'Hello world!!!', 'function');
     *    }
     *    // Write changes to the database
     *    await kit.dbCommit();
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    async dbCommit() {
        var _a;
        const params = [
            { name: 'function_' + this.functionId, scope: 'function' },
            { name: 'accountdb_' + this.domain, scope: 'global' },
        ];
        if (this.isMessage()) {
            params.push({ name: "conversation_" + this.incomingMessage.conversation.uuid, scope: 'conversation' });
        }
        try {
            return await this.DB.putAllDB(params);
        }
        catch (err) {
            if (err && 'response' in err) {
                console.log('dbCommit error', (_a = err.response) === null || _a === void 0 ? void 0 : _a.data);
            }
            else {
                console.log('dbCommit error', err);
            }
            return false;
        }
    }
    /**
     * Allows you to use the Voximplant Kit API.
     * ```js
     * // Example of getting an account name
     *  const kit = new VoximplantKit(context);
     *  try {
     *     const { success, result } = await kit.apiProxy('/v2/account/getAccountInfo');
     *     if (success) {
     *        console.log('Account name', result.domain.name);
     *     }
     *  } catch (err) {
     *     console.log(err);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param url {string} - URL address
     * @param data
     */
    apiProxy(url, data) {
        return this.api.request(url, data).then(r => {
            return r.data;
        }).catch(err => {
            var _a;
            if (err && 'response' in err) {
                return Promise.reject((_a = err.response) === null || _a === void 0 ? void 0 : _a.data);
            }
            return Promise.reject(err);
        });
    }
    /**
     * Adds a photo.
     * ```js
     * module.exports = async function(context, callback) {
     *  const kit = new VoximplantKit(context);
     *  kit.addPhoto('https://your-srite.com/img/some-photo.png');
     *  // End of function
     *  callback(200, kit.getResponseBody());
     *}
     * ```
     * @param url {String} - URL address of the photo
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
     * Gets an environment variable by name.
     * [More details here.](https://voximplant.com/kit/docs/functions/envvariables)
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  const my_var = kit.getEnvVariable('myEnv');
     *  if (my_var) {
     *    console.log(my_var);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name {string} - Variable name
     */
    getEnvVariable(name) {
        return utils_1.default.getEnvVariable(name);
    }
    /**
     * A static method used outside the function body that gets environment variables.
     * ```js
     *  const my_var = VoximplantKit.getEnvironmentVariable('myEnv');
     *  if (my_var) {
     *    console.log(my_var);
     *  }
     * ```
     * @static
     */
    static getEnvironmentVariable(name) {
        if (typeof name === 'string') {
            return name in process.env ? process.env[name] : null;
        }
        else {
            return null;
        }
    }
    setTags(tags, replace = false) {
        if (Array.isArray(tags)) {
            const payloadIndex = this.findPayloadIndex('bind_tags');
            const onlyPositiveInt = tags.filter(tag => Number.isInteger(tag) && tag >= 0);
            const type = replace ? 'replaceTags:' : 'addTags:';
            if (!replace && !onlyPositiveInt.length) {
                console.warn(type, 'the tags argument must be an array containing only positive integers');
                return false;
            }
            if (replace && tags.length && !onlyPositiveInt.length) {
                console.warn(type, 'the tags argument must be an array containing only positive integers');
            }
            this.tags = replace ? onlyPositiveInt : this.tags.concat(onlyPositiveInt);
            this.tags = Array.from(new Set(this.tags)); // only unique ids;
            this.isTagsReplace = replace;
            if (payloadIndex === -1) {
                this.replyMessage.payload.push({
                    type: "cmd",
                    name: "bind_tags",
                });
            }
            return true;
        }
        else {
            console.warn('The array must contain only integers greater than zero');
            return false;
        }
    }
    /**
     * Adds tags by id.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  kit.addTags([12, 34]);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    addTags(tags) {
        return this.setTags(tags);
    }
    /**
     * Replaces all tags.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  kit.replaceTags([12, 34]);
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    replaceTags(tags) {
        return this.setTags(tags, true);
    }
    /**
     * Gets tags.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  await kit.getTags(); // [12, 34]
     *  await kit.getTags(true); // [{id: 12, tag_name: 'my_tag'}, {id: 34, tag_name: 'my_tag2'}]
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param withName {Boolean} - If the argument is true, it returns the array with the id and tag names. Otherwise, it will return the array with the id tags
     */
    getTags(withName) {
        const tags = utils_1.default.clone(this.tags);
        if (!withName)
            return Promise.resolve(tags);
        return this.apiProxy('/v3/tags/searchTags', { 'per-page': 0 })
            .then(({ result }) => {
            return tags.map(tag => {
                const fullTag = result.find(item => item.id === tag);
                if (fullTag)
                    return { id: tag, tag_name: fullTag.tag_name };
                else {
                    return { id: tag, tag_name: null };
                }
            });
        });
    }
    /**
     * Set custom data.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  kit.setCustomData('my_data', {a: 1, b 'some text'}); // [12, 34]
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    setCustomData(name, data) {
        if (typeof name !== 'string' || !(name === null || name === void 0 ? void 0 : name.length)) {
            console.error('The name parameter must be a string');
            return false;
        }
        if (typeof data === 'undefined') {
            console.error('Missing the required parameter data');
            return false;
        }
        const payloadIndex = this.messageCustomData.findIndex(item => item.name === name);
        try {
            const customData = JSON.stringify(data);
            if (payloadIndex > -1) {
                this.messageCustomData[payloadIndex] = { type: "custom_data", name, data: customData };
            }
            else {
                this.messageCustomData = this.messageCustomData.concat({ type: "custom_data", name, data: customData });
            }
            return true;
        }
        catch (err) {
            console.error('Failed to serialize data passed to the data parameter');
            return false;
        }
    }
    /**
     * Delete custom data.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  kit.deleteCustomData('my_data');
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    deleteCustomData(name) {
        if (typeof name !== 'string' || !(name === null || name === void 0 ? void 0 : name.length)) {
            console.error('The name parameter must be a string');
            return false;
        }
        const payloadIndex = this.messageCustomData.findIndex(item => item.name === name);
        if (payloadIndex > -1) {
            this.messageCustomData.splice(payloadIndex, 1);
            return true;
        }
        return false;
    }
    /**
     * Get DialogFlow key by id.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  const dfKey = kit.getDfKey(15);
     *  if (dfKey) {
     *    console.log('My DF key:', dfKey);
     *    //... do something
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getDfKey(id) {
        return utils_1.default.getDfKey(id);
    }
    /**
     * Gets a list of available DialogFlow keys
     * ```js
     *  const kit = new VoximplantKit(context);
     *  const dfKeyList = kit.getDfKeysList();
     *  console.log('My DF keys:', dfKeyList);
     *  //... do something
     *
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getDfKeysList() {
        return utils_1.default.getDfKeysList();
    }
    /**
     * Gets an avatar reply
     * ```js
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *   const reply = kit.getAvatarReply();
     *   console.log('Reply: ', reply);
     *  }
     *
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getAvatarReply() {
        return utils_1.default.clone(this.avatarReply) || null;
    }
    /**
     * Gets a client’s SDK version.
     * ```js
     *  const kit = new VoximplantKit(context);
     *  // Get a client’s SDK version
     *  kit.version();
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    version() {
        return utils_1.default.getVersion();
    }
}
/**
 * @hidden
 */
VoximplantKit.default = VoximplantKit;
module.exports = VoximplantKit;
