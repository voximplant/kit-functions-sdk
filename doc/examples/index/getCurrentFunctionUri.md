```js
const kit = new VoximplantKit(context);
const uri = kit.getCurrentFunctionUri();
console.log('URL of the current function', uri);
// End of function
callback(200, kit.getResponseBody());
```
