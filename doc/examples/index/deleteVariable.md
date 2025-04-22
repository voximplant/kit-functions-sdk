```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
kit.deleteVariable('my_var');
// Console will print null
console.log(kit.getVariable('my_var'));
// End of function
callback(200, kit.getResponseBody());
```
