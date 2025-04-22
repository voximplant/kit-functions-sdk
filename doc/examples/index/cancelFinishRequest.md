```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (this.isMessage()) {
  kit.finishRequest();
}
// ...
// Сondition for reopening
const shouldCancel = true;
if (shouldCancel) {
  kit.cancelFinishRequest();
}
// End of function
callback(200, kit.getResponseBody());
```
