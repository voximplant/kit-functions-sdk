```js
// Initialize a VoximplantKit instance
const kit = new VoximplantKit(context);
if (this.isCall()) {
  const all_skills = kit.getSkills();
  console.log('All skills:', all_skills);
}
// End of function
callback(200, kit.getResponseBody());
```
