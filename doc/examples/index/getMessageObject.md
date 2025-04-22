```js
const kit = new VoximplantKit(context);
if (kit.isMessage() || kit.isAvatar()) {
  const messageObject = kit.getMessageObject();
  // ...do something
}
// End of function
callback(200, kit.getResponseBody());
```
