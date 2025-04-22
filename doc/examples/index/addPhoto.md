```js
module.exports = async function (context, callback) {
  const kit = new VoximplantKit(context);
  kit.addPhoto('https://your-srite.com/img/some-photo.png');
  // End of function
  callback(200, kit.getResponseBody());
};
```
