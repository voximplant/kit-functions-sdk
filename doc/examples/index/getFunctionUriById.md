```js
const kit = new VoximplantKit(context);
const uri = kit.getFunctionUriById(31);
// End of function
callback(200, kit.getResponseBody());
```
