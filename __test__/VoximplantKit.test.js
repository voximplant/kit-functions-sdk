const VoximplantKitTest = require('../dist/index.js');
const Api = require('../dist/Api');
const callContext = require('./context.js').CallContext;
const messageContext = require('./context.js').MessageContext;
const avatarContext = require('./context.js').AvatarContext;
const {
  notStringAndNumber,
  notString,
  notNumber
} = require('./constants');
const OLD_ENV = process.env;

jest.mock('../dist/DB');


jest.mock('../dist/Api');
const mMock = jest.fn();
Api.default.mockImplementation(() => {
  return {
    request: mMock
  }
});

describe('constructor', () => {
  test('calling without context throw error', () => {
    expect(() => VoximplantKitTest()).toThrow(Error);
    expect(() => new VoximplantKitTest()).toThrow(Error);
    expect(() => new VoximplantKitTest).toThrow(Error);
    expect(() => new VoximplantKitTest(callContext).__proto__.constructor()).toThrow(Error);
    expect(() => new VoximplantKitTest({})).toThrow(Error);
    expect(() => new VoximplantKitTest()).toThrow(Error);
  });

  describe.each(notStringAndNumber)('set invalid value %p as context', (context) => {
    expect(() => new VoximplantKitTest(context)).toThrow(Error);
  });

  describe.each([callContext, messageContext, avatarContext])('set valid value %p as context', (context) => {
    const instance = new VoximplantKitTest(context);
    expect(instance).toBeInstanceOf(VoximplantKitTest);
  });
})

describe('apiProxy', () => {
  const kit = new VoximplantKitTest(callContext);
  test('check api proxy', () => {
    const users = [{name: 'Bob'}];
    mMock.mockResolvedValue({data: users});
    return kit.apiProxy('/v2/account/getAccountInfo').then(data => expect(data).toEqual(users));
  });

  test('reject the request due to a network error', async () => {
    expect.assertions(1);
    mMock.mockRejectedValue(null);
    await expect(kit.apiProxy('/v2/account/getAccountInfo')).rejects.toEqual(null);
  });

  test('reject the request due to a api error', async () => {
    expect.assertions(1);
    mMock.mockRejectedValue({response: {data: false}});
    await expect(kit.apiProxy('/v2/account/getAccountInfo')).rejects.toEqual(false);
  });

  test('reject the request due to a api error', async () => {
    expect.assertions(1);
    mMock.mockRejectedValue({response: undefined});
    await expect(kit.apiProxy('/v2/account/getAccountInfo')).rejects.toEqual(undefined);
  });
})

describe('cancelFinishRequest', () => {
  describe('With call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const result = kit.cancelFinishRequest();

    test('should return true', () => {
      expect(result).toEqual(true);
    });
  });

  describe('With message context', () => {
    const kit = new VoximplantKitTest(messageContext);
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

    test('canceling an existing request', () => {
      const kit = new VoximplantKitTest(messageContext);
      const isFinish = kit.finishRequest()
      const result = kit.cancelFinishRequest();

      expect(isFinish).toEqual(true);
      expect(result).toEqual(true);
    })
  });
})

describe('cancelTransferToQueue', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const result = kit.cancelTransferToQueue();

    test('should return true', () => {
      expect(result).toEqual(true);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const transfer = kit.transferToQueue({queue_id: 100, queue_name: 'test'})
    const result = kit.cancelTransferToQueue();
    const {payload} = kit.getResponseBody();

    test('should return true', () => {
      expect(result).toEqual(true);
      expect(transfer).toEqual(true);
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
    const kit = new VoximplantKitTest(callContext);
    kit.setVariable('test_var', 'var value');

    const isDeleted = kit.deleteVariable('test_var');
    const {VARIABLES} = kit.getResponseBody();

    test('should return true', () => {
      expect(isDeleted).toEqual(true)
    });

    test('a call with a nonexistent variable name should return false', () => {
      const isDeleted = kit.deleteVariable(true);
      expect(isDeleted).toEqual(false);
    });

    test('Response body must not contain variable test_var', () => {
      const expected = {test_var: 'var value'};
      expect(VARIABLES).toEqual(expect.not.objectContaining(expected));
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const isSetVar = kit.setVariable('test_var', 'var_value');
    kit.deleteVariable('test_var');
    const {variables} = kit.getResponseBody();

    test('should return true', () => {
      expect(isSetVar).toEqual(true);
    });

    test('Response body must not contain variable test_var', () => {
      const expected = {"test_var": "var_value"};
      expect(variables).toEqual(expect.not.objectContaining(expected));
    });
  });
});

describe('finishRequest', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const isSet = kit.finishRequest();

    test('should return false', () => {
      expect(isSet).toEqual(false);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const isSet = kit.finishRequest();
    const {payload} = kit.getResponseBody();

    test('calling finishRequest again', () => {
      kit.finishRequest();
      const {payload} = kit.getResponseBody();
      const expected = [{
        type: "cmd",
        name: "finish_request"
      }];
      expect(payload).toEqual(expect.arrayContaining(expected));
    })

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

  describe('with avatar context', () => {
    const context = JSON.parse(JSON.stringify(avatarContext));
    context.request.body.is_final = true;
    const kit = new VoximplantKitTest(context);

    const messageObject = kit.getMessageObject();
    const {payload} = messageObject;

    test('The message object must contain a payload with the finish_request command', () => {
      const expected = [{
        type: "cmd",
        name: "finish_request"
      }];
      expect(payload).toEqual(expect.arrayContaining(expected));
    })
  })
});

describe('getCallData', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
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
    const kit = new VoximplantKitTest(messageContext);
    const call = kit.getCallData();

    test('Must be null', () => {
      expect(call).toBeNull();
    });
  });
});

describe('getCallHeaders', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const headers = kit.getCallHeaders();

    test('Must be an instance of the object', () => {
      expect(headers).toBeInstanceOf(Object);
    })
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const headers = kit.getCallHeaders();

    test('Must be null', () => {
      expect(headers).toBeNull();
    });
  });
})

describe('getIncomingMessage', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const result = kit.getIncomingMessage();

    test('Return null', () => {
      expect(result).toBeNull();
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const result = kit.getIncomingMessage();

    test('Should contain text and type', () => {
      expect(result).toEqual(expect.objectContaining({
        text: expect.any(String),
        type: expect.any(String),
      }),);
    });
  });
});

describe('getPriority', () => {
  const kit = new VoximplantKitTest(callContext);
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
    const kit = new VoximplantKitTest(callContext);
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
    const kit = new VoximplantKitTest(messageContext);
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

  describe('with empty context', () => {
    const context = {
      request: {
        body: {},
        headers: {}
      }
    };
    const kit = new VoximplantKitTest(context);
    const body = kit.getResponseBody();

    test('Must contain payload and variables', () => {
      expect(body).toEqual(undefined);
    });
  });
})

describe('getSkills', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const skills = kit.getSkills();

    test('Must be an instance of the Array', () => {
      expect(skills).toBeInstanceOf(Array);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const skills = kit.getSkills();

    test('Must be an instance of the Array', () => {
      expect(skills).toBeInstanceOf(Array);
    });
  });
});

describe('getVariable', () => {

  describe('with callContext', () => {
    const kit = new VoximplantKitTest(callContext);
    kit.setVariable('test_var', 'var value');
    const testVar = kit.getVariable('test_var');

    test('Must be equal var value', () => {
      expect(testVar).toEqual('var value');
    });
  });

  describe.each(notString)('set %p as parameter', (a) => {
    const kit = new VoximplantKitTest(callContext);
    const testVar = kit.getVariable(a);

    test(`Returns a value ${a} equal to equal null`, () => {
      expect(testVar).toBeNull();
    });
  });
});

describe('getVariables', () => {
  const kit = new VoximplantKitTest(callContext);
  const vars = kit.getVariables();

  test('Must be an instance of the Object', () => {
    expect(vars).toBeInstanceOf(Object);
  });
})

describe('isCall', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const isCall = kit.isCall();

    test('Should return true', () => {
      expect(isCall).toEqual(true);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const isCall = kit.isCall();

    test('Should return false', () => {
      expect(isCall).toEqual(false);
    });
  });
});

describe('isMessage', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const isMessage = kit.isMessage();

    test('Should return false', () => {
      expect(isMessage).toEqual(false);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const isMessage = kit.isMessage();

    test('Should return true', () => {
      expect(isMessage).toEqual(true);
    });
  });
});

describe('isAvatar', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const isAvatar = kit.isAvatar();

    test('Should return false', () => {
      expect(isAvatar).toEqual(false);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(callContext);
    const isAvatar = kit.isAvatar();

    test('Should return false', () => {
      expect(isAvatar).toEqual(false);
    });
  });

  describe('with avatar context', () => {
    const kit = new VoximplantKitTest(avatarContext);
    const isAvatar = kit.isAvatar();

    test('Should return true', () => {
      expect(isAvatar).toEqual(true);
    });
  });
});

describe('removeSkill', () => {
  describe.each([callContext, messageContext])('with %# context', (context) => {
    const kit = new VoximplantKitTest(context);
    kit.setSkill({skill_id: 33, level: 5});
    const isRemoved = kit.removeSkill(33);
    const localSkills = kit.getSkills();

    test('should return true', () => {
      expect(isRemoved).toEqual(true);
    });

    test('skills must not contain my_skill', () => {
      const expected = [{
        skill_id: 33,
        level: 5
      }];
      expect(localSkills).toEqual(
        expect.not.arrayContaining(expected),
      );
    });

    test.each([
      'not_skill', ...notNumber
    ])('with a nonexistent id', (a) => {
      const result = kit.removeSkill(a);
      expect(result).toEqual(false);
    })
  });
});

describe('setPriority', () => {
  const kit = new VoximplantKitTest(callContext);

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
    const kit = new VoximplantKitTest(callContext);
    const isSet = kit.setReplyMessageText('test text');

    test('Should return true', () => {
      expect(isSet).toEqual(true);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
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
    const kit = new VoximplantKitTest(callContext);
    const isSet = kit.setReplyMessageText(a);

    test(`setReplyMessageText with ${a} value, return false`, () => {
      expect(isSet).toEqual(false);
    });
  });
});


describe('setSkill', () => {
  let kit, isSet, localSkills;

  beforeEach(() => {
    kit = new VoximplantKitTest(callContext)
    isSet = kit.setSkill({skill_id: 36, level: 5});
    localSkills = kit.getSkills();
  });

  describe('with CallContext', () => {
    test('should return true', () => {
      expect(isSet).toEqual(true);
    });

    test('getSkills should contain skill with id 36', () => {
      isSet = kit.setSkill({skill_id: 36, level: 5});
      localSkills = kit.getSkills();
      const expected = [{
        skill_id: 36,
        level: 5
      }];
      expect(localSkills).toEqual(
        expect.arrayContaining(expected),
      );
    });

    test('update local skill', () => {
      kit.setSkill({skill_id: 35, level: 3});
      kit.setSkill({skill_id: 35, level: 4});
      const skills = kit.getSkills();

      const expected = [{
        skill_id: 35,
        level: 4
      }];
      expect(skills).toEqual(
        expect.arrayContaining(expected),
      );
    })

    test('setting skills without id should return false', () => {
      const isSet = kit.setSkill({level: 5});
      expect(isSet).toEqual(false);
    });

    test('setting skills without level should return false', () => {
      const isSet = kit.setSkill({skill_id: 5});
      expect(isSet).toEqual(false);
    });

    test('Response body skills property must be contain skill with id 36', () => {
      const res = kit.getResponseBody();
      const expected = [{skill_id: 36, level: 5}];
      expect(res.SKILLS).toEqual(
        expect.arrayContaining(expected),
      );
    });

    describe.each([
      {id: true, value: undefined},
      {id: 22, value: false},
      {id: 22, value: 'ssss'},
      {id: 'sss', value: NaN},
    ])('set skill by id %#', (a) => {
      const kit = new VoximplantKitTest(callContext);
      const isSet = kit.setSkill({skill_id: a.id, level: a.value});

      localSkills = kit.getSkills();
      test(`Should return false`, () => {
        expect(isSet).toEqual(false);
      });
    });

    describe.each([1, 2, 3, 4, 5])('set level %p', (a) => {
      const kit = new VoximplantKitTest(callContext);
      const isSet = kit.setSkill({skill_id: 37, level: a});
      test(`Should return true`, () => {
        expect(isSet).toEqual(true);
      });
    });

    describe.each([-1, -2, 0, 6, 7, 8, notNumber])('set level %p', (a) => {
      const kit = new VoximplantKitTest(callContext);
      const isSet = kit.setSkill({skill_id: 37, level: a});
      test(`Should return false`, () => {
        expect(isSet).toEqual(false);
      });
    });

    describe.each([1, 2, 3, 4, 5])('set skill_id %p', (a) => {
      const kit = new VoximplantKitTest(callContext);
      const isSet = kit.setSkill({skill_id: a, level: 5});
      test(`Should return true`, () => {
        expect(isSet).toEqual(true);
      });
    });

    describe.each([-1, -2, notNumber])('set invalid value to skill_id %p', (a) => {
      const kit = new VoximplantKitTest(callContext);
      const isSet = kit.setSkill({skill_id: a, level: 5});
      test(`Should return false`, () => {
        expect(isSet).toEqual(false);
      });
    });
  })

  describe('with messageContext', () => {
    test('Response body skills property must be contain skill with id 36', () => {
      const kit = new VoximplantKitTest(messageContext);
      kit.setSkill({skill_id: 36, level: 5});
      kit.transferToQueue({queue_id: 111});
      const index = kit.findPayloadIndex('transfer_to_queue');
      const res = kit.getResponseBody();
      const skills = res.payload[index].skills;
      const expected = [{skill_id: 36, level: 5}];

      expect(skills).toEqual(
        expect.arrayContaining(expected),
      );
    });
  });
})


describe('setVariable', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const isSet = kit.setVariable('test_var', 'var value');
    kit.setVariable('test_var1', undefined);
    kit.setVariable('test_var2', null);
    kit.setVariable('test_var3', {
      toString() {
        return new Error()
      }
    });
    kit.setVariable('test_var4', [1]);
    const value = kit.getVariable('test_var');
    const {VARIABLES} = kit.getResponseBody();

    test('Should return true', () => {
      expect(isSet).toEqual(true);
    });

    test('The value must be equal to var value', () => {
      expect(value).toEqual('var value');
    });

    test('Response body should contain my_var', () => {
      const expected = {
        "UTC": "UTC",
        "my_var": "Value for my var",
        "phone": "79030000001",
        "test_var": "var value",
        "test_var1": "undefined",
        "test_var2": "null",
        "test_var3": "{}",
        "test_var4": "[1]"
      };

      expect(VARIABLES).toEqual(expect.objectContaining(expected),);
    })
  });

  describe.each(notString)('Set not a string %p as variable name', (a) => {
    const kit = new VoximplantKitTest(callContext);
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
    const kit = new VoximplantKitTest(callContext);
    const isSet = kit.setVariable('test_var', a);
    const value = kit.getVariable('test_var');
    const {VARIABLES} = kit.getResponseBody();
    const expected = a;

    test(`Should return false`, () => {
      expect(isSet).toEqual(true);
    });

    test('The value must be', () => {
      expect(value).toEqual(expected);
    });

    test('the variables in the response must be strings', () => {
      expect(VARIABLES['test_var']).toEqual(typeof expected === "object" ? JSON.stringify(expected) : expected + '');
    })
  });
});

describe('transferToQueue', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const isSet = kit.transferToQueue({queue_id: 155, queue_name: 'test_queue'});

    test('Should return false', () => {
      expect(isSet).toEqual(false);
    });
  });

  describe('with message context', () => {
    describe('Set valid queue_id and queue_name', () => {
      const kit = new VoximplantKitTest(messageContext);
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

    describe('update transfer', () => {
      const kit = new VoximplantKitTest(messageContext);
      kit.transferToQueue({queue_id: 155, queue_name: 'test_queue'});
      kit.transferToQueue({queue_id: 160, queue_name: 'test_queue2'});
      const {payload} = kit.getResponseBody();

      test('Payload should contain transfer_to_queue command', () => {
        const expected = [{
          "name": "transfer_to_queue",
          "priority": 0,
          "queue": {"queue_id": 160, "queue_name": "test_queue2"},
          "skills": [],
          "type": "cmd"
        }];
        expect(payload).toEqual(expect.arrayContaining(expected));
      });
    })

    describe.each(notStringAndNumber)('Set invalid value %p as queue_id and queue_name', (a) => {
      const kit = new VoximplantKitTest(messageContext);
      const isSet = kit.transferToQueue({queue_id: a, queue_name: a});

      test('Should return false', () => {
        expect(isSet).toEqual(false);
      });
    });


    describe.each(notNumber)('Set not a number %p as queue_id and set valid queue_name', (a) => {
      const kit = new VoximplantKitTest(messageContext);
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
      const kit = new VoximplantKitTest(messageContext);
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
  const kit = new VoximplantKitTest(callContext);
  const version = kit.version();

  test('Should return string', () => {
    expect(typeof version).toEqual('string');
  });
});

describe('loadDatabases', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    test('call DB.getAllDB with params', async () => {
      await kit.loadDatabases();
      const args = [
        'function_' + kit.functionId,
        'accountdb_' + kit.domain,]
      expect(kit.DB.getAllDB).toHaveBeenCalledWith(args);
    })
  });

  describe('with call context', () => {
    const kit = new VoximplantKitTest(messageContext);
    test('call DB.getAllDB with params', async () => {
      await kit.loadDatabases();
      const args = [
        'function_' + kit.functionId,
        'accountdb_' + kit.domain,
        'conversation_' + kit.incomingMessage.conversation.uuid]
      expect(kit.DB.getAllDB).toHaveBeenCalledWith(args);
    })
  });
});

describe('dbGet', () => {
  const kit = new VoximplantKitTest(messageContext);

  test('call DB.getScopeValue with params from a undefined scope', async () => {
    await kit.dbGet('test');
    expect(kit.DB.getScopeValue).toHaveBeenCalledWith('test', 'global');
  });

  describe.each(['global', 'function', 'conversation'])('call DB.getScopeValue  with params from %p scope', (scope) => {
    test('should passed', async () => {
      await kit.dbGet('test', scope);
      expect(kit.DB.getScopeValue).toHaveBeenCalledWith('test', scope);
    })
  });
});

describe('dbSet', () => {
  const kit = new VoximplantKitTest(messageContext);

  test('call DB.setScopeValue with params for a undefined scope', async () => {
    await kit.dbSet('test', 'test_value');
    expect(kit.DB.setScopeValue).toHaveBeenCalledWith('test', 'test_value', 'global');
  });

  describe.each(['global', 'function', 'conversation'])('call DB.setScopeValue  with params for %p scope', (scope) => {
    test('should passed', async () => {
      await kit.dbSet('test', 'test_value', scope);
      expect(kit.DB.setScopeValue).toHaveBeenCalledWith('test', 'test_value', scope);
    })
  });
});

describe('dbDelete', () => {
  const kit = new VoximplantKitTest(messageContext);

  describe.each(['global', 'function', 'conversation'])('call deleteScopeValue with params for %p scope', (scope) => {
    test('should passed', async () => {
      await kit.dbDelete('test',  scope);
      expect(kit.DB.deleteScopeValue).toHaveBeenCalledWith('test', scope);
    })
  });

  describe.each(['global', 'function', 'conversation'])('call with valid params for %p scope', (scope) => {
    test('should passed', async () => {
      await kit.dbDelete('test',  scope);
      expect(kit.DB.deleteScopeValue).toHaveBeenCalledWith('test', scope);
    })
  });
});

describe('dbGetAll', () => {
  const kit = new VoximplantKitTest(messageContext);

  test('call DB.dbGetAll with a undefined scope', async () => {
    kit.DB.getScopeAllValues.mockReturnValue({test: 'test'});
    await kit.dbGetAll();
    expect(kit.DB.getScopeAllValues).toHaveBeenCalledWith('global');
  });

  test('call DB.dbGetAll with a string param', async () => {
    kit.DB.getScopeAllValues.mockReturnValue({test: 'test'});
    await kit.dbGetAll('function');
    expect(kit.DB.getScopeAllValues).toHaveBeenCalledWith('function');
  })
});

describe('dbCommit', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    test('call DB.putAllDB with params', async () => {
      await kit.dbCommit();
      const args = [
        {name: 'function_' + kit.functionId, scope: 'function'},
        {name: 'accountdb_' + kit.domain, scope: 'global'}
      ]
      expect(kit.DB.putAllDB).toHaveBeenCalledWith(args);
    });

    test('reject  DB.putAllDB', async () => {
      kit.DB.putAllDB.mockRejectedValue(null);
      const isCommit = await kit.dbCommit();
      expect(isCommit).toEqual(false);
    })
  });

  describe('with call context', () => {
    const kit = new VoximplantKitTest(messageContext);
    test('call DB.putAllDB with params', async () => {
      await kit.dbCommit();
      const args = [
        {name: 'function_' + kit.functionId, scope: 'function'},
        {name: 'accountdb_' + kit.domain, scope: 'global'},
        {name: "conversation_" + kit.incomingMessage.conversation.uuid, scope: 'conversation'}
      ]
      expect(kit.DB.putAllDB).toHaveBeenCalledWith(args);
    })
  });
})

describe('addPhoto', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const isAdded = kit.addPhoto('test');

    test('should return true', () => {
      expect(isAdded).toEqual(true);
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const isAdded = kit.addPhoto('test');
    const {payload} = kit.getResponseBody();

    test('should return true', () => {
      expect(isAdded).toEqual(true);
    });

    test('payload must contain photo', () => {
      expect(payload).toEqual(expect.arrayContaining([{
        type: "photo",
        url: 'test',
        file_name: "file",
        file_size: 123
      }]))
    })
  });
});

describe('getEnvVariable', () => {
  afterEach(() => {
    process.env = {...OLD_ENV};
  })

  describe('with call context', () => {
    process.env.test = 'test value'; // mock
    const kit = new VoximplantKitTest(callContext);
    const envVar = kit.getEnvVariable('test');
    const emptyVar = kit.getEnvVariable('testVar');
    const boolVar = kit.getEnvVariable(true);

    test('should return string', () => {
      expect(envVar).toEqual('test value');
    });

    test('should return null', () => {
      expect(emptyVar).toBeNull();
    });

    test('should return null', () => {
      expect(boolVar).toBeNull();
    });
  });

  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const envVar = kit.getEnvVariable('test');
    const emptyVar = kit.getEnvVariable('testVar');
    const boolVar = kit.getEnvVariable(true);

    test('should return string', () => {
      expect(envVar).toEqual('test value');
    });

    test('should return null', () => {
      expect(emptyVar).toBeNull();
    });

    test('should return null', () => {
      expect(boolVar).toBeNull();
    });
  });
});

describe('addTags', () => {
  describe('with call context', () => {
    let kit;

    beforeEach(() => kit = new VoximplantKitTest(callContext));

    test('Bind an array without numbers should return false', async () => {
      const isBind = await kit.addTags(notNumber);
      expect(isBind).toEqual(false);
    });

    test('Binding not an array should return false', async () => {
      const isBind = await kit.addTags({0: 'asda', d: 'aaa'});
      expect(isBind).toEqual(false);
    })

    test('should return true', async () => {
      const isBind = await kit.addTags([15, 1, 8, 0, -1]);
      expect(isBind).toEqual(true);
    });

    test('result must be contain array with positive Int', async () => {
      //const tags = await kit.getTags();
      const tags = kit.tags;
      await kit.addTags([15, 1, 8, 0, -1]);

      const expected = [...tags, 15, 1, 8]
      const response = kit.getResponseBody();
      expect(response.TAGS).toEqual(expect.arrayContaining(expected));
    })

  });

  describe('with message context', () => {
    let kit;

    beforeEach(() => kit = new VoximplantKitTest(messageContext));

    test('Payload must be contain bind_tags command', async () => {
      await kit.addTags([34]);
      await kit.addTags([34, 53]);
      const {payload} = kit.getResponseBody();
      const expected = [{
        type: "cmd",
        name: "bind_tags",
        tags: [22, 55, 78, 93, 34, 53],
        replace: false
      }];
      expect(payload).toEqual(expect.arrayContaining(expected));
    });
  });
})

describe('replaceTags', () => {
  describe('with call context', () => {
    let kit;

    beforeEach(() => kit = new VoximplantKitTest(callContext));

    test('an array without numbers should return false', () => {
      const isBind = kit.replaceTags(notNumber);
      expect(isBind).toEqual(true);
    });

    test('not an array should return false', () => {
      const isBind = kit.replaceTags({0: 'asda', d: 'aaa'});
      expect(isBind).toEqual(false);
    })

    test('should return true', () => {
      const isBind = kit.replaceTags([15, 1, 8, 0, -1]);
      expect(isBind).toEqual(true);
    });

    test('result must be contain array with positive Int', async () => {
      const tags = await kit.getTags();
      kit.replaceTags([15, 1, 8, 0, -1]);
      const expected = [15, 1, 8, 0];
      const response = kit.getResponseBody();
      expect(response.TAGS).toEqual(expect.arrayContaining(expected));
    });
  });

  describe('with message context', () => {
    let kit;

    beforeEach(() => kit = new VoximplantKitTest(messageContext));

    test('after initialization, tags should contain only positive integers', async () => {
      const tags = await kit.getTags();
      expect(tags).toEqual(expect.arrayContaining([22, 55, 78, 93]));
    })

    test('Payload must be contain bind_tags command', async () => {
      await kit.replaceTags([34, 53]);
      const {payload} = kit.getResponseBody();
      const expected = [{
        type: "cmd",
        name: "bind_tags",
        tags: [34, 53],
        replace: true
      }];
      expect(payload).toEqual(expect.arrayContaining(expected));
    });
  });
})

describe('getTags', () => {
  describe('with call context', () => {
    let kit;

    beforeEach(() => kit = new VoximplantKitTest(callContext));

    test('should return an array of id tags', async () => {
      const tags = await kit.getTags();
      const expected = [...callContext.request.body.TAGS];
      expect(tags).toEqual(expect.arrayContaining(expected))
    });

    test('successful request', async () => {
      expect.assertions(1);
      mMock.mockResolvedValue({data: {success: true, result: [{id: 22, tag_name: 'my_tag'}]}});
      const tags = await kit.getTags(true);
      const expected = [
        {"id": 22, "tag_name": 'my_tag'},
        {"id": 55, "tag_name": null},
        {"id": 78, "tag_name": null},
        {"id": 93, "tag_name": null}
      ];
      expect(tags).toEqual(expect.objectContaining(expected))
    });

    test('failed request', async () => {
      expect.assertions(1);
      mMock.mockRejectedValue(false);
      await expect(kit.getTags(true)).rejects.toEqual(false);
    });
  });

  describe('with message context', () => {
    let kit;

    beforeEach(() => {
      const context = JSON.parse(JSON.stringify(messageContext));
      context.request.body.conversation.custom_data.request_data.tags = [22, 55, 78, 93]
      kit = new VoximplantKitTest(context);
    });

    test('should return an array of id tags', async () => {
      const tags = await kit.getTags();
      const expected = [...callContext.request.body.TAGS];
      expect(tags).toEqual(expect.arrayContaining(expected))
    });

    test('successful request', async () => {
      expect.assertions(1);
      mMock.mockResolvedValue({data: {success: true, result: [{id: 22, tag_name: 'my_tag'}]}});
      const tags = await kit.getTags(true);
      const expected = [
        {"id": 22, "tag_name": 'my_tag'},
        {"id": 55, "tag_name": null},
        {"id": 78, "tag_name": null},
        {"id": 93, "tag_name": null}
      ];
      expect(tags).toEqual(expect.objectContaining(expected))
    });

    test('failed request', async () => {
      expect.assertions(1);
      mMock.mockRejectedValue(false);
      await expect(kit.getTags(true)).rejects.toEqual(false);
    });
  });
})

describe('getEnvironmentVariable', () => {
  afterEach(() => {
    process.env = {...OLD_ENV};
  })

  describe('without context', () => {
    process.env.test = 'test value'; // mock
    const envVar = VoximplantKitTest.getEnvironmentVariable('test');
    const emptyVar = VoximplantKitTest.getEnvironmentVariable('testVar');
    const boolVar = VoximplantKitTest.getEnvironmentVariable(true);

    test('should return string', () => {
      expect(envVar).toEqual('test value');
    });

    test('should return null', () => {
      expect(emptyVar).toBeNull();
    });

    test('should return null', () => {
      expect(boolVar).toBeNull();
    });
  });
});



describe('getConversationUuid', () => {
  describe('with message context', () => {
    const kit = new VoximplantKitTest(messageContext);
    const uuid = kit.getConversationUuid();

    test('uuid should be instance of String', () => {
      expect(typeof uuid === 'string').toEqual(true);
    })
  })

  describe('with avatar context', () => {
    const kit = new VoximplantKitTest(avatarContext);
    const uuid = kit.getConversationUuid();

    test('uuid should be instance of String', () => {
      expect(typeof uuid === 'string').toEqual(true);
    })
  })

  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
    const uuid = kit.getConversationUuid();

    test('uuid should be equal Null', () => {
      expect(uuid).toBeNull();
    })
  })
})

describe('getFunctionUriById', () => {
  afterEach(() => {
    process.env = {...OLD_ENV};
  })

  describe('with valid id', () => {
    process.env.KIT_FUNC_URLS = JSON.stringify({31: 'function_url'})
    const kit = new VoximplantKitTest(callContext);

    test('should return string', () => {
     const uri =  kit.getFunctionUriById(31);
     expect(uri).toEqual('function_url');
    })
  });

  describe('with valid id as string', () => {
    process.env.KIT_FUNC_URLS = JSON.stringify({31: 'function_url'})
    const kit = new VoximplantKitTest(callContext);

    test('should return string', () => {
      const uri =  kit.getFunctionUriById('31');
      expect(uri).toEqual('function_url');
    })
  });

  describe('with invalid id as number', () => {
    process.env.KIT_FUNC_URLS = JSON.stringify({31: 'function_url'})
    const kit = new VoximplantKitTest(callContext);

    test('should return null', () => {
      const uri =  kit.getFunctionUriById(33);
      expect(uri).toBeNull();
    })
  })

  describe.each(notStringAndNumber)('set invalid value %p as id', (value) => {
    process.env.KIT_FUNC_URLS = JSON.stringify({31: 'function_url'})
    const kit = new VoximplantKitTest(callContext);
    test('should return null', () => {
      const uri =  kit.getFunctionUriById(value);
      expect(uri).toBeNull();
    })

  });

})
