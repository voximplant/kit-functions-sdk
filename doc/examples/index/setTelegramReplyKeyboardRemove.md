```js
const kit = new VoximplantKit(context);
if (kit.isMessage()) {
  const remove_params = {
    remove_keyboard: true, // required
    selective: false,
  };
  kit.setTelegramReplyKeyboardRemove(remove_params);
}

// End of function
callback(200, kit.getResponseBody());
```
