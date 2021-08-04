"use strict";
const axios_1 = require("axios");
const Api_1 = require("./Api");
const DB_1 = require("./DB");
const Message_1 = require("./Message");
const utils_1 = require("./utils");
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
        const variables = {};
        for (let key in this.variables) {
            if (this.variables.hasOwnProperty(key)) {
                try {
                    variables[key] = this.variables[key] + '';
                }
                catch (e) {
                    variables[key] = '';
                }
            }
        }
        if (this.isCall()) {
            return {
                "VARIABLES": variables,
                "SKILLS": this.skills
            };
        }
        else if (this.isMessage()) {
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
                variables: variables
            }; // To be added in the future
        }
        else {
            return;
            //return data
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
     * Gets a variable by name
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
     * Adds a skill or updates it if the skill name already exists.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isCall()) {
     *    kit.setSkill('some_skill_name', 5);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name Skill name
     * @param level Proficiency level
     */
    setSkill(name, level) {
        if (typeof name !== 'string' || !Number.isInteger(level))
            return false;
        if (level < 1 || level > 5) {
            console.warn('level property must be a integer from 1 to 5');
            return false;
        }
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
     * Removes a skill by name.
     * ```js
     *  // Initialize a VoximplantKit instance
     *  const kit = new VoximplantKit(context);
     *  if (this.isCall()) {
     *    kit.removeSkill('some_skill_name');
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param name {string} - Name of the skill to remove
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
        const payloadIndex = this.replyMessage.payload.findIndex(item => {
            return item.type === "cmd" && item.name === "finish_request";
        });
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
     *  kit.transferToQueue({queue_id: null, queue_name: 'some_queue_name'});
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     * @param queue {QueueInfo} - Queue name or id. If both parameters are passed, the queue id has a higher priority
     */
    transferToQueue(queue) {
        if (!this.isMessage())
            return false;
        if (typeof queue.queue_id === "undefined" || !Number.isInteger(queue.queue_id))
            queue.queue_id = null;
        if (typeof queue.queue_name === "undefined" || typeof queue.queue_name !== "string")
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
        const payloadIndex = this.replyMessage.payload.findIndex(item => {
            return item.type === "cmd" && item.name === "transfer_to_queue";
        });
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
     *    kit.dbCommit()
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
     *    kit.dbCommit()
     *  } catch(err) {
     *    console.log(err);
     *  }
     *  // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    async dbCommit() {
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
            console.log(err);
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
     * Gets an environment variable by name
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
        if (typeof name === 'string') {
            return name in process.env ? process.env[name] : null;
        }
        else {
            return null;
        }
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
        return "0.0.43";
    }
}
/**
 * @hidden
 */
VoximplantKit.default = VoximplantKit;
module.exports = VoximplantKit;
