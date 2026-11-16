```js
const kit = new VoximplantKit(context);
if (kit.isMessage()) {
  const uuid = kit.getConversationUuid();
  //... do something
}
// End of function
callback(200, kit.getResponseBody());
```
