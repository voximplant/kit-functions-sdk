```js
// Example of getting an account name
const kit = new VoximplantKit(context);
try {
  const { success, result } = await kit.apiProxy('/v2/account/getAccountInfo');
  if (success) {
    console.log('Account name', result.domain.name);
  }
} catch (err) {
  console.log(err);
}
// End of function
callback(200, kit.getResponseBody());
```
