```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
const all_vars = kit.getVariables();
console.log(all_vars);
// End of function
callback(200, kit.getResponseBody());
```
