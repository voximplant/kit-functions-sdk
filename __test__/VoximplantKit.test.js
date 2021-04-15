const VoximplantKit = require('../dist/index.js');
const axios = require('axios');
const api = require('../dist/Api')
const callContext = require('../temp.js').CallContext;
console.log(callContext);

const kit = new VoximplantKit(callContext);
/*jest.mock('axios', () => {
  return {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    default: {
      create: jest.fn(),
    },
    request: jest.fn(() => Promise.resolve()),
  };
});*/

jest.mock('../dist/Api', () => {

  return  {
    default: jest.fn().mockReturnValue(() => {
      return {
        request: jest.fn(),
      }
    }),
    request: jest.fn()
  }
})

/*jest.mock('axios', () => {
  return {
    default: {
      create: jest.fn(() => ({
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn(), eject: jest.fn() },
          response: { use: jest.fn(), eject: jest.fn() }
        },
        request: jest.fn(),
      })),
    },
    create: jest.fn(() => ({
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      },
    })),
    get: jest.fn(),
  }
})*/

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

  console.log(api);

  //axios.default.create.request.mockResolvedValue(resp)
  test('check api proxy', () => {
    const users = [{name: 'Bob'}];
    const resp = users;
    api.default.request.mockResolvedValue({data: users})
    return kit.apiProxy('/v2/account/getAccountInfo').then(data => expect(data).toEqual(users))
  })

})


