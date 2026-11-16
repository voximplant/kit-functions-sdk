```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (kit.isMessage()) {
  console.log('This function is called from the channel');
  const message = kit.getIncomingMessage();
  //...
}
// End of function
callback(200, kit.getResponseBody());
```
