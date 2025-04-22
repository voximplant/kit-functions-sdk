```js
const kit = new VoximplantKit(context);
const dfKeyList = kit.getDfKeysList();
console.log('My DF keys:', dfKeyList);
//... do something

// End of function
callback(200, kit.getResponseBody());
```
