```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (kit.isCall()) {
  const headers = kit.getCallHeaders();
  console.log(headers);
}
// End of function
callback(200, kit.getResponseBody());
```
