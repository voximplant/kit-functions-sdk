```js
const kit = new VoximplantKit(context);
if (kit.isMessage()) {
  try {
    const conversationId = kit.getConversationUuid();
    const callbackUri = kit.getFunctionUriById(33);
    const { text } = kit.getIncomingMessage();
    // This variable must be added to the environment variables yourself.
    const avatarId = kit.getEnvVariable('avatarId');
    const voxAccountId = kit.getEnvVariable('VOXIMPLANT_ACCOUNT_ID');
    const avatarLogin = kit.getEnvVariable('VOXIMPLANT_AVATAR_LOGIN');
    const avatarPass = kit.getEnvVariable('VOXIMPLANT_AVATAR_PASSWORD');
    await kit.avatar.sendMessageToAvatar({
      callbackUri,
      voxAccountId,
      avatarLogin,
      avatarPass,
      avatarId,
      conversationId,
      utterance: text,
      customData: {},
    });
  } catch (err) {
    console.error(err);
  }
}

// End of function
callback(200, kit.getResponseBody());
```
