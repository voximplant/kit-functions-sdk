const VoximplantKit = require('../dist/index.js');
const axios = require('axios');
const api = require('../dist/Api')
const callContext = require('../../temp.js').CallContext;


jest.mock('../dist/Api');
const mMock = jest.fn();
api.default.mockImplementation(() => {
  return {
    request: mMock
  }
});

const kit = new VoximplantKit(callContext);



/**
 * kit.setPriority
 */
describe.each([
  11, 2, -100, 10, Infinity, -Infinity, 'sdfsd', 'asdas', new Error(), () => 11, NaN
])('set value %p as priority', (a) => {
  const priority = kit.setPriority(a);
  test(`Returns a priority ${a} equal to a value between 0 and 10`, () => {
    expect(typeof priority === 'boolean').toBeTruthy();
    console.log(kit.getPriority())
    expect(kit.getPriority()).toBeGreaterThanOrEqual(0);
    expect(kit.getPriority()).toBeLessThanOrEqual(10);
  });
});

describe('Get incoming message without context', () => {
  test('Return null', () => {
    expect(kit.getIncomingMessage()).toBeNull();
  });
});

describe.only('check api mock', () => {
  test('check api proxy', () => {
    const users = [{name: 'Bob'}];
    mMock.mockResolvedValue({data: users});
    return kit.apiProxy('/v2/account/getAccountInfo').then(data => expect(data).toEqual(users))
  });
})


