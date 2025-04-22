```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
// Transfer a client to the queue
kit.transferToQueue({ queue_id: null, queue_name: 'some_queue_name' });
// Set the highest priority
kit.setPriority(10);
// End of function
callback(200, kit.getResponseBody());
```
