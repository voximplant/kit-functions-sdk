```js
const kit = new VoximplantKit(context);
await kit.getTags(); // [12, 34]
await kit.getTags(true); // [{id: 12, tag_name: 'my_tag'}, {id: 34, tag_name: 'my_tag2'}]
// End of function
callback(200, kit.getResponseBody());
```
