var dts = require('dts-bundle');

dts.bundle({
  out: '../voximplant-kit-sdk.d.ts',
  name: '@voximplant/kit-functions-sdk',
  main: 'dist/dts/index.d.ts'
});