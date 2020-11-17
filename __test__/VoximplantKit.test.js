const VoximplantKit = require('../dist/index.js').default;

const kit = new VoximplantKit();

describe.each([
 11,2,-100, Infinity, -Infinity, 'sdfsd', 'asdas', new Error(), () => 11, NaN
])('set value %p as priority', (a) => {
  const priority = kit.setPriority(a);
  test(`Returns a priority ${priority} equal to a value between 0 and 10`, () => {
    expect(kit.setPriority(priority)).toBeGreaterThanOrEqual(0);
    expect(kit.setPriority(priority)).toBeLessThan(10);
  });
});
