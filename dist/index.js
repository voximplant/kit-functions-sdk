"use strict";
const axios_1 = require("axios");
const Api_1 = require("./Api");
const DB_1 = require("./DB");
const Message_1 = require("./Message");
const utils_1 = require("./utils");
class VoximplantKit {
    /**
     * The class VoximplantKit is a middleware for working with functions
     * ```js
     * module.exports = async function(context, callback) {
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Some code
     *  console.log(Date.now());
     *  // End of function work
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
        this.incomingMessage = new Message_1.default();
        this.replyMessage = new Message_1.default(true);
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
        this.call = this.getRequestDataProperty('CALL');
        // Store Call headers
        this.callHeaders = this.getRequestDataProperty('HEADERS');
        // Store variables data
        this.variables = this.getRequestDataVariables();
        // Store skills data
        this.skills = this.getRequestDataProperty('SKILLS', []); //this.getSkills()
        this.api = new Api_1.default(this.domain, this.accessToken, this.apiUrl);
        this.DB = new DB_1.default(this.api);
        if (this.isMessage()) {
            this.incomingMessage = utils_1.default.clone(this.requestData);
            this.replyMessage.type = this.requestData.type;
            this.replyMessage.sender.is_bot = true;
            this.replyMessage.conversation = utils_1.default.clone(this.requestData.conversation);
            this.replyMessage.payload.push({
                type: "properties",
                message_type: "text"
            });
        }
    }
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
    /**
     * load Databases
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Reading contents from global scope
     *    const global_scope = kit.dbGetAll('global');
     *    console.log(global_scope)
     *  } catch(err) {
     *    console.log(err);
     *  }
     * ```
     */
    async loadDatabases() {
        const _DBs = [
            this.DB.getDB("function_" + this.functionId),
            this.DB.getDB("accountdb_" + this.domain)
        ];
        if (this.isMessage()) {
            _DBs.push(this.DB.getDB("conversation_" + this.incomingMessage.conversation.uuid));
        }
        return await this.DB.getAllDB(_DBs);
    }
    /**
     * Get function response
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param data
     */
    getResponseBody(data) {
        if (this.isCall())
            return {
                "VARIABLES": this.variables,
                "SKILLS": this.skills
            };
        if (this.isMessage()) {
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
     * Get incoming message (Read only)
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Checking that the function is called from a channel
     *  if (kit.isMessage()) {
     *    // Getting text from an incoming message
     *    const message = kit.getIncomingMessage();
     *    console.log(message.text);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getIncomingMessage() {
        return this.isMessage() ? utils_1.default.clone(this.incomingMessage) : null;
    }
    /**
     * Set the response text to an incoming message
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Checking that the function is called from a channel
     *  if (kit.isMessage()) {
     *    // Getting text from an incoming message
     *    const message = kit.getIncomingMessage();
     *    console.log(message.text);
     *    // Set the response text
     *    kit.setReplyMessageText('you wrote ' + message.text);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    setReplyMessageText(text) {
        if (typeof text === "string") {
            this.replyMessage.text = text;
            return true;
        }
        return false;
    }
    /**
     * The function was called from a call
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    console.log('This function is called from the call')
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    isCall() {
        return this.eventType === "in_call_function" /* in_call_function */;
    }
    /**
     * The function was called from a message
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isMessage()) {
     *    console.log('This function is called from the channel');
     *    const message = kit.getIncomingMessage();
     *    //...
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    isMessage() {
        return this.eventType === "incoming_message" /* incoming_message */;
    }
    /**
     * Get Variable
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  const my_var = kit.getVariable('my_var');
     *  if (my_var) {
     *    console.log(my_var);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getVariable(name) {
        return (typeof name === 'string' && typeof this.variables[name] !== "undefined") ? this.variables[name] : null;
    }
    /**
     * Set variable
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  kit.setVariable('my_var', 'some_value');
     *  console.log(kit.getVariable('my_var'));
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name {String} - Variable name
     * @param value {String} - Variable value
     */
    setVariable(name, value) {
        if (typeof name === 'string' && typeof value === 'string') {
            this.variables[name] = value;
            return true;
        }
        return false;
    }
    /**
     * Delete variable
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  kit.deleteVariable('my_var');
     *  // The console will write null
     *  console.log(kit.getVariable('my_var'));
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name {String} - Variable name
     */
    deleteVariable(name) {
        if (typeof name === 'string') {
            delete this.variables[name];
        }
    }
    /**
     * Get call headers
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    const headers = kit.getCallHeaders();
     *    console.log(headers);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getCallHeaders() {
        return this.isCall() ? utils_1.default.clone(this.callHeaders) : null;
    }
    /**
     * Get all call data
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (kit.isCall()) {
     *    const call = kit.getCallData();
     *    // Get the phone from which the call was made
     *    console.log(call.phone_a);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getCallData() {
        return this.isCall() ? utils_1.default.clone(this.call) : null;
    }
    /**
     * Get all variables
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  const all_vars = kit.getVariables();
     *  console.log('all_vars');
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getVariables() {
        return utils_1.default.clone(this.variables);
    }
    /**
     * Get all skills
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isCall()) {
     *    const all_skills = kit.getSkills();
     *    console.log('All skills:', all_skills);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getSkills() {
        return utils_1.default.clone(this.skills);
    }
    /**
     * Set skill
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isCall()) {
     *    kit.setSkill('some_skill_name', 5);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name
     * @param level
     */
    setSkill(name, level) {
        if (typeof name !== 'string' || typeof level !== 'number')
            return false;
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
        return true;
    }
    /**
     * Remove skill
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isCall()) {
     *    kit.removeSkill('some_skill_name');
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    removeSkill(name) {
        const skillIndex = this.skills.findIndex(skill => {
            return skill.skill_name === name;
        });
        if (skillIndex > -1) {
            this.skills.splice(skillIndex, 1);
            return true;
        }
        return false;
    }
    /**
     * Set the priority of the call. The higher the priority, the less time the client will wait for the operator's answer.
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer to queue by name some_queue_name
     *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
     *  // Set the maximum priority
     *  kit.setPriority(10);
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    setPriority(value) {
        if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10) {
            this.priority = value;
            return true;
        }
        else {
            console.warn(`The value ${value} cannot be set as a priority. An integer from 0 to 10 is expected`);
            return false;
        }
    }
    /**
     * Get call priority
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Returns a number from 0 to 10
     *  const priority = kit.getPriority();
     *  if (priority === 10) {
     *    // Something to do
     *  } else if (priority === 5) {
     *    // Something to do
     *  } else {
     *    // Something to do
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getPriority() {
        return this.priority;
    }
    /**
     * Finish current request in conversation
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isMessage()) {
     *    kit.finishRequest();
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    finishRequest() {
        if (!this.isMessage())
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
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isMessage()) {
     *    kit.finishRequest();
     *  }
     *  // ...
     *  // Some condition for cancellation finishRequest
     *  const shouldCancel = true;
     *  if (shouldCancel) {
     *    kit.cancelFinishRequest();
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
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
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer to queue by name some_queue_name
     *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    transferToQueue(queue) {
        if (!this.isMessage())
            return false;
        if (typeof queue.queue_id === "undefined")
            queue.queue_id = null;
        if (typeof queue.queue_name === "undefined")
            queue.queue_name = null;
        // TODO find out if there should be an OR operator
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
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  // Transfer to queue by name some_queue_name
     *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
     *  //...
     *  // Some condition for cancellation transfer to queue
     *  const shouldCancel = true;
     *  if (shouldCancel) {
     *    kit.cancelTransferToQueue();
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
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
     * Get value from DB by key
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Get the value from the function scope by the test_key key
     *    const _test = kit.dbGet('test_key', 'function')
     *    console.log(_test);
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    dbGet(key, scope = "global") {
        return this.DB.getScopeValue(key, scope);
    }
    /**
     * Set value in DB by key
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Get the value from the function scope by the test_key key
     *    const _test = kit.dbGet('test_key', 'function')
     *    // If there is no data, then we write it down
     *    if (_test === null) {
     *      kit.dbSet('test_key', 'Hello world!!!', 'function');
     *    }
     *    // Writing changes to the database
     *    kit.dbCommit()
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    dbSet(key, value, scope = "global") {
        return this.DB.setScopeValue(key, value, scope);
    }
    /**
     * Get all DB scope by name
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Reading contents from global scope
     *    const global_scope = kit.dbGetAll('global');
     *    console.log(global_scope)
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    dbGetAll(scope = "global") {
        return utils_1.default.clone(this.DB.getScopeAllValues(scope));
    }
    /**
     * Commit DB changes
     * ```js
     *  // Initializing a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  try {
     *    // Connecting the internal database
     *    await kit.loadDatabases();
     *    // Get the value from the function scope by the test_key key
     *    const _test = kit.dbGet('test_key', 'function')
     *    // If there is no data, then we write it down
     *    if (_test === null) {
     *      kit.dbSet('test_key', 'Hello world!!!', 'function');
     *    }
     *    // Writing changes to the database
     *    kit.dbCommit()
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    async dbCommit() {
        const _DBs = [
            this.DB.putDB("function_" + this.functionId, 'function'),
            this.DB.putDB("accountdb_" + this.domain, 'global')
        ];
        if (this.isMessage()) {
            _DBs.push(this.DB.putDB("conversation_" + this.incomingMessage.conversation.uuid, 'conversation'));
        }
        try {
            return await this.DB.putAllDB(_DBs);
        }
        catch (err) {
            console.log(err);
            return false;
        }
    }
    /**
     * Voximplant Kit API proxy
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
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     * @param url {string} - Url address
     * @param data
     */
    apiProxy(url, data) {
        return this.api.request(url, data).then(r => {
            return r.data;
        }).catch(err => {
            console.log(err);
        });
    }
    /**
     * Add photo
     * ```js
     * module.exports = async function(context, callback) {
     *  const kit = new VoximplantKit(context);
     *  kit.addPhoto('https://your-srite.com/img/some-photo.png');
     *  // End of function work
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
     * ```js
     *  const kit = new VoximplantKit(context);
     *  // Get client version
     *  kit.version();
     *  // End of function work
     *  callback(200, kit.getResponseBody());
     * ```
     */
    version() {
        return "0.0.40";
    }
}
/**
 * @hidden
 */
VoximplantKit.default = VoximplantKit;
module.exports = VoximplantKit;
