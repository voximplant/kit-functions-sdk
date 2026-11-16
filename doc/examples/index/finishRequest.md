```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (this.isMessage()) {
  kit.finishRequest();
}
// End of function
callback(200, kit.getResponseBody());
```
