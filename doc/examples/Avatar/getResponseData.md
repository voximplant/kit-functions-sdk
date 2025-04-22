```js
const kit = new VoximplantKit(context);
if (kit.isAvatar()) {
  const avatarResponse = kit.avatar.getResponseData();
  console.log(avatarResponse);
  // ... do something
}

// End of function
callback(200, kit.getResponseBody());
```
