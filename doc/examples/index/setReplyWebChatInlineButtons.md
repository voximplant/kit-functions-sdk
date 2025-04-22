```js
const kit = new VoximplantKit(context);
if (kit.isMessage() || kit.isAvatar()) {
// Text is required for each button and must not be greater than 40 char.
// The max number of buttons is 13.
const buttons = [
{type: 'text', text: 'Some btn text', data: 'Some btn data'}
{type: 'text', text: 'Another btn text', data: JSON.stringify({name: 'Jon Doe', age: 30})}
]
kit.setReplyWebChatInlineButtons(buttons);
}

// End of function
callback(200, kit.getResponseBody());
```
