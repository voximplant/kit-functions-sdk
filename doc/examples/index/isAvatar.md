```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (kit.isAvatar()) {
  //...do something
}
// End of function
callback(200, kit.getResponseBody());
```
