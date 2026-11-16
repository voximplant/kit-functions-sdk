```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (kit.isCall()) {
  const call = kit.getCallData();
  // Get the phone number from which the call is made
  console.log(call.phone_a);
}
// End of function
callback(200, kit.getResponseBody());
```
