```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
try {
  // Connect available databases
  await kit.loadDatabases();
  // Get the value from the function scope by key
  const _test = kit.dbGet('test_key', 'function');
  console.log(_test);
} catch (err) {
  console.log(err);
}
// End of function
callback(200, kit.getResponseBody());
```
