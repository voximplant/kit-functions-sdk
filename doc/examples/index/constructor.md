```js
module.exports = async function (context, callback) {
  // Initialize a VoximplantKit instance
  const kit = new VoximplantKit(context);
  // Some code
  console.log(Date.now());
  // End of function
  callback(200, kit.getResponseBody());
};
```
