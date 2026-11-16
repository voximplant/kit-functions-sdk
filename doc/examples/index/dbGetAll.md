```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
try {
  // Connect available databases
  await kit.loadDatabases();
  // Read contents from the global scope
  const global_scope = kit.dbGetAll('global');
  console.log(global_scope);
} catch (err) {
  console.log(err);
}
// End of function
callback(200, kit.getResponseBody());
```
