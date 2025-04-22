```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
try {
  // Connect available databases
  await kit.loadDatabases();
  // Get a value from the function scope by key
  const _test = kit.dbGet('test_key', 'function');
  // If there is no data
  if (_test === null) {
    kit.dbSet('test_key', 'Hello world!!!', 'function');
  }
  // Write changes to the database
  await kit.dbCommit();
} catch (err) {
  console.log(err);
}
// End of function
callback(200, kit.getResponseBody());
```
