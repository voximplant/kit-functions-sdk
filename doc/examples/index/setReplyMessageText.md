```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
// Check if the function is called from a channel
if (kit.isMessage()) {
  // Get text from an incoming message
  const message = kit.getIncomingMessage();
  console.log(message.text);
  // Set text of the reply
  kit.setReplyMessageText('you wrote ' + message.text);
}
// End of function
callback(200, kit.getResponseBody());
```
