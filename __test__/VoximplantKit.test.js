const VoximplantKit = require('../dist/index.js');
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

/**
 * kit.setPriority
 */
describe('setPriority', () => {
  const kit = new VoximplantKit();

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
})

describe('getIncomingMessage', () => {
  describe('without context', () => {
    const kit = new VoximplantKit();

    test('Return null', () => {
      expect(kit.getIncomingMessage()).toBeNull();
    });
  });

  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);

    test('Return null', () => {
      expect(kit.getIncomingMessage()).toBeNull();
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);

    test('Should contain text and type', () => {
      expect(kit.getIncomingMessage()).toEqual(expect.objectContaining({
        text: expect.any(String),
        type: expect.any(String),
      }),);
    });
  });
})


describe('apiProxy', () => {
  const kit = new VoximplantKit();
  test('check api proxy', () => {
    const users = [{name: 'Bob'}];
    mMock.mockResolvedValue({data: users});
    return kit.apiProxy('/v2/account/getAccountInfo').then(data => expect(data).toEqual(users))
  });
})

describe('finishRequest', () => {
  describe('With call context', () => {
    const kit = new VoximplantKit(callContext);
    const result = kit.finishRequest();

    test('should return false', () => {
      expect(result).toBeFalsy()
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

describe('cancelTransferToQueue', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const result = kit.cancelTransferToQueue();

    test('should return true', () => {
      expect(result).toBeTruthy()
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

describe('deleteVariable', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const isSetVar = kit.setVariable('test_var', 'var value');
    kit.deleteVariable('test_var');
    const {VARIABLES} = kit.getResponseBody();

    test('should return true', () => {
      expect(isSetVar).toBeTruthy()
    });

    test('Response body must not contain variable test_var', () => {
      const expected = {test_var: 'var value'};
      expect(VARIABLES).toEqual(expect.not.objectContaining(expected));
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);
    const isSetVar = kit.setVariable('test_var', 'var value');
    kit.deleteVariable('test_var');
    const {variables} = kit.getResponseBody();

    test('should return true', () => {
      expect(isSetVar).toBeTruthy()
    });

    test('Response body must not contain variable test_var', () => {
      const expected = {test_var: 'var value'};
      expect(variables).toEqual(expect.not.objectContaining(expected));
    });
  });
});

describe('finishRequest', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.finishRequest();

    test('should return false', () => {
      expect(isSet).toBeFalsy();
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);
    const isSet = kit.finishRequest();
    const {payload} = kit.getResponseBody();

    test('should return true', () => {
      expect(isSet).toBeTruthy();
    });

    test('Payload should contain transfer_to_queue command', () => {
      const expected = [{
        type: "cmd",
        name: "finish_request"
      }];
      expect(payload).toEqual(expect.arrayContaining(expected));
    });
  })
});

describe('getCallData', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const call = kit.getCallData();

    test('contain phone_a and phone_b', () => {
      expect(call).toEqual(
        expect.objectContaining({
          phone_a: expect.any(String),
          phone_b: expect.any(String),
        }),
      );
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);
    const call = kit.getCallData();

    test('Must be null', () => {
      expect(call).toBeNull();
    });
  });
});

describe('getCallHeaders', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const headers = kit.getCallHeaders();

    test('Must be an instance of the object', () => {
      expect(headers).toBeInstanceOf(Object);
    })
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);
    const headers = kit.getCallHeaders();

    test('Must be null', () => {
      expect(headers).toBeNull();
    });
  });
})

describe('getPriority', () => {
  const kit = new VoximplantKit(callContext);
  const priority = kit.getPriority();

  test('Must be an instance of the Number', () => {
    expect(typeof priority).toBe('number');
  });

  test(`Returns value between 0 and 10`, () => {
    expect(priority).toBeGreaterThanOrEqual(0);
    expect(priority).toBeLessThanOrEqual(10);
  });
})

describe('getResponseBody', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const body = kit.getResponseBody();

    test('Must contain VARIABLES and SKILLS', () => {
      expect(body).toEqual(
        expect.objectContaining({
          VARIABLES: expect.any(Object),
          SKILLS: expect.any(Array),
        }),
      );
    });
  });

  describe('with call context', () => {
    const kit = new VoximplantKit(messageContext);
    const body = kit.getResponseBody();

    test('Must contain payload and variables', () => {
      expect(body).toEqual(
        expect.objectContaining({
          payload: expect.any(Array),
          variables: expect.any(Object),
        }),
      );
    });
  });
})

describe('getSkills', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const skills = kit.getSkills();

    test('Must be an instance of the Array', () => {
      expect(skills).toBeInstanceOf(Array);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);
    const skills = kit.getSkills();

    test('Must be an instance of the Array', () => {
      expect(skills).toBeInstanceOf(Array);
    });
  });
});

describe('getVariable', () => {
  const kit = new VoximplantKit();

  describe('without context', () => {
    kit.setVariable('test_var', 'var value');
    const testVar = kit.getVariable('test_var');

    test('Must be equal var value', () => {
      expect(testVar).toEqual('var value');
    });
  });

  describe.each([
    11, Infinity, -Infinity, () => undefined, null, new Error(), () => 11, NaN
  ])('set %p as parameter', (a) => {
    const testVar = kit.getVariable(a);

    test(`Returns a value ${a} equal to equal null`, () => {
      expect(testVar).toBeNull();
    });
  });
});

describe('getVariables', () => {
  const kit = new VoximplantKit();
  const vars = kit.getVariables();

  test('Must be an instance of the Object', () => {
    expect(vars).toBeInstanceOf(Object);
  });
})

describe('isCall', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const isCall = kit.isCall();

    test('Should return true', () => {
      expect(isCall).toEqual(true);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);
    const isCall = kit.isCall();

    test('Should return false', () => {
      expect(isCall).toEqual(false);
    });
  });
});

describe('isMessage', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const isMessage = kit.isMessage();

    test('Should return false', () => {
      expect(isMessage).toEqual(false);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);
    const isMessage = kit.isMessage();

    test('Should return true', () => {
      expect(isMessage).toEqual(true);
    });
  });
});

describe.only('removeSkill', () => {
  describe.each([callContext, messageContext])('with %# context', (a) => {
    const kit = new VoximplantKit(a.value);
    const isSet = kit.setSkill('my_skill', 5);
    const result = kit.removeSkill('my_skill');
    const localSkills = kit.getSkills();

    test('setSkill should return true', () => {
      expect(isSet).toEqual(true);
    });

    test('removeSkill should return true', () => {
      expect(result).toEqual(true);
    });

    test('getSkills must not contain my_skill', () => {
      const expected = [{
        skill_name: 'my_skill',
        level: 5
      }];
      expect(localSkills).toEqual(
        expect.not.arrayContaining(expected),
      );
    });
  });
});

