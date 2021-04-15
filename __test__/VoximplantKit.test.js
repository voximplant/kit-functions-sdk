const VoximplantKit = require('../dist/index.js');
const axios = require('axios');
const api = require('../dist/Api')
const callContext = require('../../temp.js').CallContext;
const messageContext = require('../../temp.js').MessageContext;


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
    expect(kit.getPriority()).toBeGreaterThanOrEqual(0);
    expect(kit.getPriority()).toBeLessThanOrEqual(10);
  });
});

describe('Get incoming message without context', () => {
  test('Return null', () => {
    expect(kit.getIncomingMessage()).toBeNull();
  });
});

describe('check api mock', () => {
  test('check api proxy', () => {
    const users = [{name: 'Bob'}];
    mMock.mockResolvedValue({data: users});
    return kit.apiProxy('/v2/account/getAccountInfo').then(data => expect(data).toEqual(users))
  });
})

describe(' check finishRequest', () => {
  describe('With call context', () => {
    const kit = new VoximplantKit(callContext);
    const result = kit.finishRequest();
    const {payload} = kit.getResponseBody();

    test('should return false', () => {
      expect(result).toBeFalsy()
    });

    test('must not contain finish_request command', () => {
      const expected = [{
        type: "cmd",
        name: "finish_request"
      }];
      expect(payload).toEqual(expect.not.arrayContaining(expected));
    });
  });

  describe('With message context', () => {
    const kit = new VoximplantKit(messageContext);
    const result = kit.finishRequest();
    const {payload} = kit.getResponseBody();

    test('should return true', () => {
      expect(result).toBeTruthy()
    });

    test('Payload should contain finish_request command', () => {
      const expected = [{
        type: "cmd",
        name: "finish_request"
      }];
      expect(payload).toEqual(expect.arrayContaining(expected));
    });
  });
})

describe('check cancelTransferToQueue', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const result = kit.cancelTransferToQueue();
    const {payload} = kit.getResponseBody();

    test('should return true', () => {
      expect(result).toBeTruthy()
    });

    test('Payload should contain transfer_to_queue command', () => {
      const expected = [{
        type: "cmd",
        name: "transfer_to_queue"
      }];
      expect(payload).toEqual(expect.not.arrayContaining(expected));
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);
    const result = kit.cancelTransferToQueue();
    const {payload} = kit.getResponseBody();

    test('should return true', () => {
      expect(result).toBeTruthy()
    });

    test('Payload must not contain transfer_to_queue command', () => {
      const expected = [{
        type: "cmd",
        name: "transfer_to_queue"
      }];
      expect(payload).toEqual(expect.not.arrayContaining(expected));
    });
  })
});




