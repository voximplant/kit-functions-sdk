import { AvatarConfig } from "./types";
export default class Avatar {
    private avatarApi;
    private imApiUrl;
    /**
     * @hidden
     */
    constructor(avatarApiUrl: string, imApiUrl: string);
    /**
     * @hidden
     */
    private parseJwt;
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
    sendMessageToAvatar(config: AvatarConfig): Promise<void>;
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
    sendMessageToConversation(conversationUuid: string, message: unknown): Promise<void>;
}
