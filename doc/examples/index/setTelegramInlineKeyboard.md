```js
const kit = new VoximplantKit(context);
if (kit.isMessage() || kit.isAvatar()) {
  // Without a reply message, the keyboard will not be displayed
  const message = kit.getIncomingMessage();
  kit.setReplyMessageText(`You wrote: ${message.text}`);

  // An array of arrays with keyboard buttons.
  // Text is required for each keyboard.
  const inline_keyboard_markup = [
    // Row one
    [
      { text: 'text', url: 'url', callback_data: '1' },
      { text: 'text 2', url: 'url' },
    ],
    // Row two
    [{ text: 'text', url: 'url', callback_data: '1' }],
  ];
  kit.setTelegramInlineKeyboard(buttons);

  // Calling the kit.setTelegramInlineKeyboard method
  // with an empty array will clear previously passed buttons
  // kit.setTelegramInlineKeyboard([]);
}

// End of function
callback(200, kit.getResponseBody());
```
