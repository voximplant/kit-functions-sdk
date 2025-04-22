```js
const kit = new VoximplantKit(context);
if (kit.isAvatar()) {
  const conversationUuid = kit.getConversationUuid();
  const message = kit.getMessageObject();
  try {
    await kit.avatar.sendMessageToConversation(conversationUuid, message);
  } catch (err) {
    console.error(err);
  }
}

// End of function
callback(200, kit.getResponseBody());
```
