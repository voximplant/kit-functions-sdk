```js
const kit = new VoximplantKit(context);
if (kit.isMessage() || kit.isAvatar()) {
  const message = kit.getIncomingMessage();
  kit.setReplyMessageText(`You wrote: ${message.text}`);
  const keyboard = [
    {
      buttons: [
        {
          text: 'test 1', // Required
          payload: 'test payload 1',
          type: 'QUICK_REPLY', // Required
        },
        {
          text: 'test 2', // Required
          payload: 'test payload 2',
          type: 'QUICK_REPLY', // Required
        },
      ],
    },
  ];
  const isSet = kit.setWhatsappEdnaKeyboard(keyboard);
  console.log('Buttons for whatsapp have been added:', isSet);
}

// End of function
callback(200, kit.getResponseBody());
```
