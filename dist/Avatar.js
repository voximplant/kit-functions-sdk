"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const utils_1 = require("./utils");
/**
 * @hidden
 */
const sendMessageConfig = {
    voxAccountId: false,
    avatarLogin: false,
    avatarPass: false,
    avatarId: false,
    callbackUri: false,
    utterance: false,
    conversationId: false,
};
/**
 * @hidden
 */
const stopSessionConfig = {
    voxAccountId: false,
    avatarLogin: false,
    avatarPass: false,
    avatarId: false,
    conversationId: false,
};
function checkParams(defaultConfig, config) {
    var _a;
    for (let key in config) {
        if (key in defaultConfig && typeof key === 'string' && ((_a = config[key]) === null || _a === void 0 ? void 0 : _a.length))
            defaultConfig[key] = true;
    }
    Object.entries(defaultConfig).forEach(item => {
        if (item[1] === false)
            throw new Error(`Missing the required parameter "${item[0]}"`);
    });
}
class Avatar {
    /**
     * @hidden
     */
    constructor(avatarApiUrl, imApiUrl, headers) {
        this.responseData = null;
        this.avatarLogin = '';
        this.voxAccountId = '';
        this.jwt = '';
        this.imApiUrl = imApiUrl;
        this.avatarApiUrl = avatarApiUrl;
        this.kitHeaders = headers || {};
        this.avatarApi = axios_1.default.create({
            baseURL: `${avatarApiUrl}api/v1/chats`,
            timeout: 15000
        });
    }
    /**
     * @hidden
     */
    setResponseData(responseData) {
        this.responseData = responseData;
    }
    /**
     * @hidden
     */
    parseJwt(token) {
        try {
            const result = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            return !!result ? result : null;
        }
        catch (err) {
            console.error(err.message);
            return null;
        }
    }
    /**
     * Gets response data from an avatar.
     *```js
     * const kit = new VoximplantKit(context);
     * if (kit.isAvatar()) {
     *   const avatarResponse = kit.avatar.getResponseData();
     *   console.log(avatarResponse);
     *   // ... do something
     * }
     *
     * // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    getResponseData() {
        return this.responseData ? utils_1.default.clone(this.responseData) : null;
    }
    setAvatarApiUrl(url) {
        if (typeof url === 'string' && url.length) {
            this.avatarApi.defaults.baseURL = `${url}api/v1/chats`;
            return;
        }
        this.avatarApi.defaults.baseURL = `${this.avatarApiUrl}api/v1/chats`;
    }
    /**
     * Send a message to a Voximplant avatar.
     * ```js
     * const kit = new VoximplantKit(context);
     * if (kit.isMessage()) {
     *   try {
     *     const conversationId = kit.getConversationUuid();
     *     const callbackUri = kit.getFunctionUriById(33);
     *     const {text} = kit.getIncomingMessage();
     *     // This variable must be added to the environment variables yourself.
     *     const avatarId = kit.getEnvVariable('avatarId');
     *     const voxAccountId = kit.getEnvVariable('VOXIMPLANT_ACCOUNT_ID');
     *     const avatarLogin = kit.getEnvVariable('VOXIMPLANT_AVATAR_LOGIN');
     *     const avatarPass = kit.getEnvVariable('VOXIMPLANT_AVATAR_PASSWORD');
     *     await kit.avatar.sendMessageToAvatar({
     *       callbackUri,
     *       voxAccountId,
     *       avatarLogin,
     *       avatarPass,
     *       avatarId,
     *       conversationId,
     *       utterance: text,
     *       customData: {}
     *     })
     *   } catch (err) {
     *     console.error(err);
     *   }
     * }
     *
     * // End of function
     * callback(200, kit.getResponseBody());
     * ```
     */
    async sendMessageToAvatar(config) {
        const { voxAccountId, avatarLogin, avatarPass, avatarId, callbackUri, utterance, conversationId, customData = {} } = config;
        checkParams(sendMessageConfig, config);
        const jwt = await this.loginAvatar(voxAccountId, avatarLogin, avatarPass);
        if (!jwt) {
            throw new Error('Failed to log in to the avatar');
        }
        const response = await this.avatarApi.post(`/${avatarId}/${conversationId}`, {
            callbackUri: callbackUri,
            utterance: utterance,
            customData: JSON.stringify(customData || {}),
        }, {
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'x-kit-event-type': 'avatar_function',
                ...this.kitHeaders
            }
        });
        console.log(response);
        return response === null || response === void 0 ? void 0 : response.data;
    }
    async loginAvatar(accountId, subuserLogin, subuserPassword) {
        const { exp = 0 } = this.jwt && this.parseJwt(this.jwt) || {};
        const isActiveJwt = Date.now() < exp * 1000;
        if (accountId === this.voxAccountId && subuserLogin === this.avatarLogin && this.jwt && isActiveJwt) {
            return this.jwt;
        }
        const { data } = await this.avatarApi.post('/login', {
            accountId,
            subuserLogin,
            subuserPassword
        });
        const { jwt } = data || {};
        this.avatarLogin = subuserLogin;
        this.voxAccountId = accountId;
        this.jwt = jwt !== null && jwt !== void 0 ? jwt : '';
        return jwt !== null && jwt !== void 0 ? jwt : '';
    }
    /**
     * Terminates an avatar session.
     *```js
     * const kit = new VoximplantKit(context);
     * // This variable must be added to the environment variables yourself.
     * const avatarId = kit.getEnvVariable('avatarId');
     * const conversationId = kit.getConversationUuid();
     * const voxAccountId = kit.getEnvVariable('VOXIMPLANT_ACCOUNT_ID');
     * const avatarLogin = kit.getEnvVariable('VOXIMPLANT_AVATAR_LOGIN');
     * const avatarPass = kit.getEnvVariable('VOXIMPLANT_AVATAR_PASSWORD');
     * if (kit.isAvatar()) {
     *   try {
     *     await kit.avatar.stopAvatarSession({
     *       voxAccountId,
     *       avatarLogin,
     *       avatarPass,
     *       avatarId,
     *       conversationId,
     *     })
     *   } catch (err) {
     *     console.error(err);
     *   }
     * }
     * // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    async stopAvatarSession(config) {
        const { voxAccountId, avatarLogin, avatarPass, avatarId, conversationId, } = config;
        checkParams(stopSessionConfig, config);
        const jwt = await this.loginAvatar(voxAccountId, avatarLogin, avatarPass);
        if (!jwt) {
            throw new Error('Failed to log in to the avatar');
        }
        return await this.avatarApi.post(`/${avatarId}/${conversationId}/stop`, {}, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });
    }
    /**
     * Send the avatar's reply to the conversation.
     *```js
     * const kit = new VoximplantKit(context);
     * if (kit.isAvatar()) {
     *  const conversationUuid = kit.getConversationUuid();
     *  const message = kit.getMessageObject();
     *  try {
     *    await kit.avatar.sendMessageToConversation(conversationUuid, message);
     *  } catch(err) {
     *    console.error(err)
     *  }
     * }
     *
     * // End of function
     *  callback(200, kit.getResponseBody());
     * ```
     */
    async sendMessageToConversation(conversationUuid, message) {
        const botUrl = `${this.imApiUrl}/api/v3/botService/sendResponse?conversation_uuid=${conversationUuid}`;
        const { data } = await axios_1.default.post(botUrl, message);
        return data;
    }
}
exports.default = Avatar;
