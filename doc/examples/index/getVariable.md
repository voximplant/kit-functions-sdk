```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
const my_var = kit.getVariable('my_var');
if (my_var) {
  console.log(my_var);
}
// End of function
callback(200, kit.getResponseBody());
```
