import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AvatarConfig, AvatarMessageObject, AvatarStopSessionConfig, ChannelDataObject } from "./types";
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
const sendMessageConfig = {
  voxAccountId: false,
  avatarLogin: false,
  avatarPass: false,
  avatarId: false,
  callbackUri: false,
  utterance: false,
  conversationId: false,
}
/**
 * @hidden
 */
const stopSessionConfig = {
  voxAccountId: false,
  avatarLogin: false,
  avatarPass: false,
  avatarId: false,
  conversationId: false,
}

/**
 * @hidden
 */
type DefaultConfig = typeof sendMessageConfig | typeof stopSessionConfig;


function checkParams(defaultConfig: DefaultConfig, config: AvatarConfig | AvatarStopSessionConfig) {
  for (let key in config) {
    if (key in defaultConfig && typeof key === 'string' && config[key]?.length) defaultConfig[key] = true;
  }

  Object.entries(defaultConfig).forEach(item => {
    if (item[1] === false) throw new Error(`Missing the required parameter "${ item[0] }"`)
  })
}

export default class Avatar {
  private avatarApi: AxiosInstance;
  private imApiUrl: string;
  private avatarApiUrl: string;
  private responseData: AvatarMessageObject | null = null;
  private kitHeaders: Record<string, string>
  private avatarLogin = '';
  private voxAccountId = '';
  private jwt = '';

  /**
   * @hidden
   */
  constructor(avatarApiUrl: string, imApiUrl: string, headers?: Record<string, string>) {
    this.imApiUrl = imApiUrl;
    this.avatarApiUrl = avatarApiUrl;
    this.kitHeaders = headers || {};
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
   * Gets response data from an avatar.
   *@exampleFile Avatar/getResponseData.md
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
   * Send a message to a Voximplant avatar.
   * @exampleFile Avatar/sendMessageToAvatar.md
   */
  public async sendMessageToAvatar(config: AvatarConfig): Promise<unknown> {
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

    checkParams(sendMessageConfig, config);

    const jwt = await this.loginAvatar(voxAccountId, avatarLogin, avatarPass);

    if (!jwt) {
      throw new Error('Failed to log in to the avatar')
    }

    const response = await this.avatarApi.post(`/${ avatarId }/${ conversationId }`, {
      callbackUri: callbackUri,
      utterance: utterance,
      customData: JSON.stringify(customData || {}),
    }, {
      headers: {
        'Authorization': `Bearer ${ jwt }`,
        'x-kit-event-type': 'avatar_function',
        ...this.kitHeaders
      }
    });

    return response?.data;
  }

  private async loginAvatar(accountId: string, subuserLogin: string, subuserPassword: string): Promise<string> {
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
    this.jwt = jwt ?? '';

    return jwt ?? '';
  }


  /**
   * Terminates an avatar session.
   *@exampleFile Avatar/stopAvatarSession.md
   */
  async stopAvatarSession(config: AvatarStopSessionConfig): Promise<void> {
    const {
      voxAccountId,
      avatarLogin,
      avatarPass,
      avatarId,
      conversationId,
    } = config;

    checkParams(stopSessionConfig, config);

    const jwt = await this.loginAvatar(voxAccountId, avatarLogin, avatarPass);

    if (!jwt) {
      throw new Error('Failed to log in to the avatar')
    }

    return await this.avatarApi.post(`/${ avatarId }/${ conversationId }/stop`, {}, {
      headers: {
        'Authorization': `Bearer ${ jwt }`
      }
    });
  }

  /**
   * Send the avatar's reply to the conversation.
   *@exampleFile Avatar/sendMessageToConversation.md
   */
  public async sendMessageToConversation(conversationUuid: string, message: ChannelDataObject): Promise<unknown> {
    const botUrl = `${ this.imApiUrl }/api/v3/botService/sendResponse?conversation_uuid=${ conversationUuid }`;
    const {data} = await axios.post(botUrl, message)
    return data;
  }
}
