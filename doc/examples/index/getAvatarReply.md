```js
const kit = new VoximplantKit(context);
if (kit.isCall()) {
  const reply = kit.getAvatarReply();
  console.log('Reply: ', reply);
}

// End of function
callback(200, kit.getResponseBody());
```
