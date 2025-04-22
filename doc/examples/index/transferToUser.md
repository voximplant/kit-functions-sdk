```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (this.isMessage() || this.isAvatar()) {
  // Use user_id or user_email.
  kit.transferToUser({ user_id: 12 });
}
// End of function
callback(200, kit.getResponseBody());
```
