```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
kit.setVariable('my_var', 'some_value');
console.log(kit.getVariable('my_var'));
// End of function
callback(200, kit.getResponseBody());
```
