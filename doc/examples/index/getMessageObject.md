```js
const kit = new VoximplantKit(context);
if (kit.isMessage()) {
  const messageObject = kit.getMessageObject();
  // ...do something
}
// End of function
callback(200, kit.getResponseBody());
```
