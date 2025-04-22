```js
const kit = new VoximplantKit(context);
// This variable must be added to the environment variables yourself.
const avatarId = kit.getEnvVariable('avatarId');
const conversationId = kit.getConversationUuid();
const voxAccountId = kit.getEnvVariable('VOXIMPLANT_ACCOUNT_ID');
const avatarLogin = kit.getEnvVariable('VOXIMPLANT_AVATAR_LOGIN');
const avatarPass = kit.getEnvVariable('VOXIMPLANT_AVATAR_PASSWORD');
if (kit.isAvatar()) {
  try {
    await kit.avatar.stopAvatarSession({
      voxAccountId,
      avatarLogin,
      avatarPass,
      avatarId,
      conversationId,
    });
  } catch (err) {
    console.error(err);
  }
}
// End of function
callback(200, kit.getResponseBody());
```
