```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (kit.isCall()) {
  console.log('This function is called from the call');
}
// End of function
callback(200, kit.getResponseBody());
```
