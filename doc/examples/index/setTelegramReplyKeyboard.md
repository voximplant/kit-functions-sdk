```js
const kit = new VoximplantKit(context);
if (kit.isMessage() || kit.isAvatar()) {
  // Without a reply message, the keyboard will not be displayed
  const message = kit.getIncomingMessage();
  kit.setReplyMessageText(`You wrote: ${message.text}`);

  // An array of arrays with keyboard buttons.
  // Text is required for each keyboard.
  const reply_keyboard_markup = [
    // Row one
    [{ text: 'button 1', request_contact: true }, { text: 'button 2' }],
    // Row two
    [{ text: 'button 3', request_location: true }],
  ];
  // Optional params
  const params = {
    is_persistent: false,
    resize_keyboard: false,
    one_time_keyboard: false,
    input_field_placeholder: 'Some text',
    selective: false,
  };
  kit.setTelegramReplyKeyboard(reply_keyboard_markup, params);

  // Calling the kit.settelgramreplykeyboard method
  // with an empty array will clear previously passed buttons
  // kit.setTelegramReplyKeyboard([]);
}

// End of function
callback(200, kit.getResponseBody());
```
