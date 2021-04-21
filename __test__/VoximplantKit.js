const VoximplantKit = require('../dist/index.js');
const api = require('../dist/Api')
const callContext = require('../../temp.js').CallContext;
const messageContext = require('../../temp.js').MessageContext;

const notStringAndNumber = [Infinity, -Infinity, () => undefined, null, new Error(), () => null, NaN, {}, [], true, false];
const notString = [11, -11, ...notStringAndNumber];
const notNumber = ['11', '-11',...notStringAndNumber];


jest.mock('../dist/Api');
const mMock = jest.fn();
api.default.mockImplementation(() => {
  return {
    request: mMock
  }
});

describe('apiProxy', () => {
  const kit = new VoximplantKit();
  test('check api proxy', () => {
    const users = [{name: 'Bob'}];
    mMock.mockResolvedValue({data: users});
    return kit.apiProxy('/v2/account/getAccountInfo').then(data => expect(data).toEqual(users))
  });
})

describe('cancelFinishRequest', () => {
  describe('With call context', () => {
    const kit = new VoximplantKit(callContext);
    const result = kit.cancelFinishRequest();

    test('should return true', () => {
      expect(result).toEqual(true);
    });
  });

  describe('With message context', () => {
    const kit = new VoximplantKit(messageContext);
    const result = kit.cancelFinishRequest();
    const {payload} = kit.getResponseBody();

    test('should return true', () => {
      expect(result).toEqual(true);
    });

    test('Payload should not contain finish_request command', () => {
      const expected = [{
        type: "cmd",
        name: "finish_request"
      }];
      expect(payload).toEqual(expect.not.arrayContaining(expected));
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
      expect(result).toEqual(true)
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
      expect(isSet).toEqual(true);
    });

    test('Payload should contain finish_request command', () => {
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
});

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

  describe('with message context', () => {
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


  describe('without context', () => {
    const kit = new VoximplantKit();
    kit.setVariable('test_var', 'var value');
    const testVar = kit.getVariable('test_var');

    test('Must be equal var value', () => {
      expect(testVar).toEqual('var value');
    });
  });

  describe.each([
    11, Infinity, -Infinity, () => undefined, null, new Error(), () => 11, NaN
  ])('set %p as parameter', (a) => {
    const kit = new VoximplantKit();
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

describe('removeSkill', () => {
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

describe('setPriority', () => {
  const kit = new VoximplantKit();

  describe.each([
    11, 2, -100, 10, Infinity, -Infinity, 'sdfsd', 'asdas', new Error(), () => 11, NaN
  ])('set value %p as priority', (a) => {
    const isSet = kit.setPriority(a);

    test(`Returns a priority ${a} equal to a value between 0 and 10`, () => {
      expect(typeof isSet === 'boolean').toBeTruthy();
      expect(kit.getPriority()).toBeGreaterThanOrEqual(0);
      expect(kit.getPriority()).toBeLessThanOrEqual(10);
    });
  });
})

describe('setReplyMessageText', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.setReplyMessageText('test text');

    test('Should return true', () => {
      expect(isSet).toEqual(true);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKit(messageContext);
    const isSet = kit.setReplyMessageText('test text');
    const body = kit.getResponseBody();

    test('Should return true', () => {
      expect(isSet).toEqual(true);
    });

    test('Must contain text', () => {
      expect(body).toEqual(
        expect.objectContaining({text: 'test text'}),
      );
    });
  });

  describe.each(notString)('set value %p as reply message text', (a) => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.setReplyMessageText(a);

    test(`setReplyMessageText with ${a} value, return false`, () => {
      expect(isSet).toEqual(false);
    });
  });
});

describe('setSkill', () => {
  const kit = new VoximplantKit(callContext);
  const isSet = kit.setSkill('my_skill', 5);
  const localSkills = kit.getSkills();
  const {SKILLS} = kit.getResponseBody();

  test('setSkill should return true', () => {
    expect(isSet).toEqual(true);
  });

  test('getSkills must not contain my_skill', () => {
    const expected = [{
      skill_name: 'my_skill',
      level: 5
    }];
    expect(localSkills).toEqual(
      expect.arrayContaining(expected),
    );
  });

  test('Response body skills must contain my_skill', () => {
    const expected = [{skill_name: 'my_skill', level: 5}];
    expect(SKILLS).toEqual(
      expect.arrayContaining(expected),
    );
  });

  describe.each([
    {name: true, value: undefined},
    {name: 22, value: false},
    {name: 22, value: 'ssss'},
    {name: 'sss', value: NaN},
  ])('set skill %#', (a) => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.setSkill(a.name, a.value);
    console.log(isSet, a.value)
    test(`Should return false`, () => {
      expect(isSet).toEqual(false);
    });
  });

  describe.each([1, 2, 3, 4, 5])('set level %p', (a) => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.setSkill('my_skill', a);
    test(`Should return true`, () => {
      expect(isSet).toEqual(true);
    });
  });

  describe.each([-1, -2, 0, 6, 7, 8])('set level %p', (a) => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.setSkill('my_skill', a);
    console.log(isSet);
    test(`Should return false`, () => {
      expect(isSet).toEqual(false);
    });
  });
})

describe('setVariable', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.setVariable('test_var', 'var value');
    const value = kit.getVariable('test_var');
    const {VARIABLES} = kit.getResponseBody();

    test('Should return true', () => {
      expect(isSet).toEqual(true);
    });

    test('The value must be equal to var value', () => {
      expect(value).toEqual('var value');
    });

    test('Response body should contain my_var', () => {
      expect(VARIABLES).toEqual(expect.objectContaining({
        'test_var': 'var value',
      }),);
    })
  });

  describe.each(notString)('Set not a string %p as variable name', (a) => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.setVariable(a, 'my_value');
    const value = kit.getVariable(a);

    test(`Should return false`, () => {
      expect(isSet).toEqual(false);
    });

    test('The value must be null', () => {
      expect(value).toBeNull();
    });
  });

  describe.each(notString)('Set not a string %p as variable value', (a) => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.setVariable('test_var', a);
    const value = kit.getVariable('test_var');

    test(`Should return false`, () => {
      expect(isSet).toEqual(false);
    });

    test('The value must be null', () => {
      expect(value).toBeNull();
    });
  });
});

describe('transferToQueue', () => {
  describe('with call context', () => {
    const kit = new VoximplantKit(callContext);
    const isSet = kit.transferToQueue({queue_id: 155, queue_name: 'test_queue'});

    test('Should return false', () => {
      expect(isSet).toEqual(false);
    });
  });

  describe('with message context', () => {
    describe('Set valid queue_id and queue_name', () => {
      const kit = new VoximplantKit(messageContext);
      const isSet = kit.transferToQueue({queue_id: 155, queue_name: 'test_queue'});
      const {payload} = kit.getResponseBody();

      test('Should return true', () => {
        expect(isSet).toEqual(true);
      });

      test('Payload should contain transfer_to_queue command', () => {
        const expected = [{
          "name": "transfer_to_queue",
          "priority": 0,
          "queue": {"queue_id": 155, "queue_name": "test_queue"},
          "skills": [],
          "type": "cmd"
        }];
        expect(payload).toEqual(expect.arrayContaining(expected));
      });
    });

    describe.each(notStringAndNumber)('Set invalid value %p as queue_id and queue_name', (a) => {
      const kit = new VoximplantKit(messageContext);
      const isSet = kit.transferToQueue({queue_id: a, queue_name: a});

      test('Should return false', () => {
        expect(isSet).toEqual(false);
      });
    });


    describe.each(notNumber)('Set not a number %p as queue_id and set valid queue_name', (a) => {
      const kit = new VoximplantKit(messageContext);
      const isSet = kit.transferToQueue({queue_id: a, queue_name: 'test_queue'});
      const {payload} = kit.getResponseBody();

      test('Should return true', () => {
        expect(isSet).toEqual(true);
      });

      test('Payload should contain transfer_to_queue command', () => {
        const expected = [{
          "name": "transfer_to_queue",
          "priority": 0,
          "queue": {"queue_id": null, "queue_name": "test_queue"},
          "skills": [],
          "type": "cmd"
        }];
        expect(payload).toEqual(expect.arrayContaining(expected));
      });
    });

    describe.each(notString)('Set not a string %p as queue_name and set valid queue_id', (a) => {
      const kit = new VoximplantKit(messageContext);
      const isSet = kit.transferToQueue({queue_id: 155, queue_name: a});
      const {payload} = kit.getResponseBody();

      test('Should return true', () => {
        expect(isSet).toEqual(true);
      });

      test('Payload should contain transfer_to_queue command', () => {
        const expected = [{
          "name": "transfer_to_queue",
          "priority": 0,
          "queue": {"queue_id": 155, "queue_name": null},
          "skills": [],
          "type": "cmd"
        }];
        expect(payload).toEqual(expect.arrayContaining(expected));
      });
    })
  });
});

describe('version', () => {
  const kit = new VoximplantKit();
  const version = kit.version();

  test('Should return string', () => {
    expect(typeof version).toEqual('string');
  });
});

// TODO loadDatabases, dbCommit, dbGet, dbGetAll, dbSet
