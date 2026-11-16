```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
// Transfer a client to the queue
kit.transferToQueue({ queue_id: 82 });
// End of function
callback(200, kit.getResponseBody());
```
