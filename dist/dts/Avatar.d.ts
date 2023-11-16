import { AvatarConfig, AvatarMessageObject, AvatarStopSessionConfig, ChannelDataObject } from "./types";
export default class Avatar {
    private avatarApi;
    private imApiUrl;
    private avatarApiUrl;
    private responseData;
    private kitHeaders;
    private avatarLogin;
    private voxAccountId;
    private jwt;
    /**
     * @hidden
     */
    constructor(avatarApiUrl: string, imApiUrl: string, headers?: Record<string, string>);
    /**
     * @hidden
     */
    setResponseData(responseData: AvatarMessageObject): void;
    /**
     * @hidden
     */
    private parseJwt;
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
    getResponseData(): AvatarMessageObject | null;
    setAvatarApiUrl(url: string): void;
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
    sendMessageToAvatar(config: AvatarConfig): Promise<unknown>;
    private loginAvatar;
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
    stopAvatarSession(config: AvatarStopSessionConfig): Promise<void>;
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
    sendMessageToConversation(conversationUuid: string, message: ChannelDataObject): Promise<void>;
}
