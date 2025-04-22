```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
// Return a number from 0 to 10
const priority = kit.getPriority();
if (priority === 10) {
  // Something to do
} else if (priority === 5) {
  // Something to do
} else {
  // Something to do
}
// End of function
callback(200, kit.getResponseBody());
```
