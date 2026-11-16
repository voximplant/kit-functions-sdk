```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (kit.isCall()) {
  kit.setSkill({ skill_id: 234, level: 5 });
} else if (kit.isMessage()) {
  kit.setSkill({ skill_id: 35, level: 3 });
  kit.transferToQueue({ queue_id: 72 });
}
// End of function
callback(200, kit.getResponseBody());
```
