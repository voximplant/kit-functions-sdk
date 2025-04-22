```js
const kit = new VoximplantKit(context);
const dfKey = kit.getDfKey(15);
if (dfKey) {
  console.log('My DF key:', dfKey);
  //... do something
}
// End of function
callback(200, kit.getResponseBody());
```
