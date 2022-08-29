import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiInstance, AvatarConfig, AvatarMessageObject } from "./types";
import utils from "./utils";

/**
 * @hidden
 */
type ParsedJwt = {
  aud: string[],
  exp: number,
  iat: number,
  sub: string
}

/**
 * @hidden
 */
function checkParams(config: AvatarConfig) {
  const requiredParams = {
    voxAccountId: false,
    avatarLogin: false,
    avatarPass: false,
    avatarId: false,
    callbackUri: false,
    utterance: false,
    conversationId: false,
  }

  for (let key in config) {
    if (key in requiredParams && typeof key === 'string' && config[key].length) requiredParams[key] = true;
  }

  Object.entries(requiredParams).forEach(item => {
    if (item[1] === false) throw new Error(`Missing the required parameter "${ item[0] }"`)
  })

}

export default class Avatar {
  private avatarApi: AxiosInstance;
  private imApiUrl: string;
  private avatarApiUrl: string;
  private responseData: AvatarMessageObject | null = null;

  /**
   * @hidden
   */
  constructor(avatarApiUrl: string, imApiUrl: string) {
    this.imApiUrl = imApiUrl;
    this.avatarApiUrl = avatarApiUrl;

    this.avatarApi = axios.create({
      baseURL: `${ avatarApiUrl }api/v1/chats`,
      timeout: 15000
    });
  }

  /**
   * @hidden
   */
  public setResponseData(responseData: AvatarMessageObject) {
    this.responseData = responseData;
  }

  /**
   * @hidden
   */
  private parseJwt(token: string): ParsedJwt | void {
    try {
      const result = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return !!result ? result : null;
    } catch (err) {
      console.error(err.message);
      return null;
    }
  }

  /**
   * Get response data from an avatar
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
  getResponseData(): AvatarMessageObject | null {
    return this.responseData ? utils.clone(this.responseData) : null;
  }

  setAvatarApiUrl(url: string): void {
    if (typeof url === 'string' && url.length) {
      this.avatarApi.defaults.baseURL = `${ url }api/v1/chats`;
      return;
    }

    this.avatarApi.defaults.baseURL = `${ this.avatarApiUrl }api/v1/chats`;
  }

  /**
   * Send a message to a Voximplant avatar
   * ```js
   * const kit = new VoximplantKit(context);
   *
   * if (kit.isMessage()) {
   *   try {
   *     const conversationId = kit.getConversationUuid();
   *     const callbackUri = kit.getFunctionUriById(33);
   *     const {text} = kit.getIncomingMessage();
   *
   *     // These variables must be added to the environment variables yourself
   *     const avatarId = kit.getEnvVariable('avatarId');
   *     const voxAccountId = kit.getEnvVariable('voxAccountId');
   *     const avatarLogin = kit.getEnvVariable('avatarLogin');
   *     const avatarPass = kit.getEnvVariable('avatarPass');
   *
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
  public async sendMessageToAvatar(config: AvatarConfig): Promise<void> {
    const {
      voxAccountId,
      avatarLogin,
      avatarPass,
      avatarId,
      callbackUri,
      utterance,
      conversationId,
      customData = {}
    } = config;

    checkParams(config);
    const { data } = await this.avatarApi.post('/login', {
      accountId: voxAccountId,
      subuserLogin: avatarLogin,
      subuserPassword: avatarPass
    });

    const { jwt } = data || {};

    if (!jwt) {
      throw new Error('Failed to log in to the avatar')
    }

    await this.avatarApi.post(`/${ avatarId }/${ conversationId }`, {
      callbackUri: callbackUri,
      utterance: utterance,
      customData: JSON.stringify(customData || {}),
    }, {
      headers: {
        'Authorization': `Bearer ${ data.jwt }`,
        'x-kit-event-type': 'avatar_function'
      }
    });
  }

  /**
   * Send the avatar's reply to the conversation
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
  public async sendMessageToConversation(conversationUuid: string, message: unknown): Promise<void> {
    const botUrl = `${ this.imApiUrl }/api/v3/botService/sendResponse?conversation_uuid=${ conversationUuid }`;
    await axios.post(botUrl, message)
  }
}
