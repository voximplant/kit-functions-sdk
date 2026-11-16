```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
try {
  // Connect available databases
  await kit.loadDatabases();
  // Delete a value from the function scope by key
  kit.dbDelete('test_key', 'function');
  // Write changes to the database
  await kit.dbCommit();
} catch (err) {
  console.log(err);
}
// End of function
callback(200, kit.getResponseBody());
```
