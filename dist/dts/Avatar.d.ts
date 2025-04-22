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
     *@exampleFile Avatar/getResponseData.md
     */
    getResponseData(): AvatarMessageObject | null;
    setAvatarApiUrl(url: string): void;
    /**
     * Send a message to a Voximplant avatar.
     * @exampleFile Avatar/sendMessageToAvatar.md
     */
    sendMessageToAvatar(config: AvatarConfig): Promise<unknown>;
    private loginAvatar;
    /**
     * Terminates an avatar session.
     *@exampleFile Avatar/stopAvatarSession.md
     */
    stopAvatarSession(config: AvatarStopSessionConfig): Promise<void>;
    /**
     * Send the avatar's reply to the conversation.
     *@exampleFile Avatar/sendMessageToConversation.md
     */
    sendMessageToConversation(conversationUuid: string, message: ChannelDataObject): Promise<unknown>;
}
