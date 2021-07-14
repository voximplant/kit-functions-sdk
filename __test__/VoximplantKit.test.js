const VoximplantKitTest = require('../dist/index.js');
const Api = require('../dist/Api');
const callContext = require('./context.js').CallContext;
const messageContext = require('./context.js').MessageContext;
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

  describe.each([callContext, messageContext])('set valid value %p as context', (context) => {
    const instance =  new VoximplantKitTest(context);
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

  test('reject request', async () => {
    mMock.mockRejectedValue(null);
    const result = await kit.apiProxy('/v2/account/getAccountInfo');
    expect(result).toEqual(undefined);
  })
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
    const isSetVar = kit.setVariable('test_var', 'var value');
    kit.deleteVariable('test_var');
    const {variables} = kit.getResponseBody();

    test('should return true', () => {
      expect(isSetVar).toEqual(true);
    });

    test('Response body must not contain variable test_var', () => {
      const expected = {test_var: 'var value'};
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

describe('removeSkill', () => {
  describe.each([callContext, messageContext])('with %# context', (a) => {
    const kit = new VoximplantKitTest(a);
    kit.setSkill('my_skill', 5);
    const result = kit.removeSkill('my_skill');
    const localSkills = kit.getSkills();

    test('should return true', () => {
      expect(result).toEqual(true);
    });

    test('skills must not contain my_skill', () => {
      const expected = [{
        skill_name: 'my_skill',
        level: 5
      }];
      expect(localSkills).toEqual(
        expect.not.arrayContaining(expected),
      );
    });

    test('with a nonexistent name', () => {
      const result = kit.removeSkill('not_skill');
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
  const kit = new VoximplantKitTest(callContext);
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

  test('update local skill', () => {
    const kit = new VoximplantKitTest(callContext);
    kit.setSkill('my_skill1', 3);
    kit.setSkill('my_skill1', 4);
    const skills = kit.getSkills();

    const expected = [{
      skill_name: 'my_skill1',
      level: 4
    }];
    expect(skills).toEqual(
      expect.arrayContaining(expected),
    );
  })

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
    const kit = new VoximplantKitTest(callContext);
    const isSet = kit.setSkill(a.name, a.value);
    console.log(isSet, a.value)
    test(`Should return false`, () => {
      expect(isSet).toEqual(false);
    });
  });

  describe.each([1, 2, 3, 4, 5])('set level %p', (a) => {
    const kit = new VoximplantKitTest(callContext);
    const isSet = kit.setSkill('my_skill', a);
    test(`Should return true`, () => {
      expect(isSet).toEqual(true);
    });
  });

  describe.each([-1, -2, 0, 6, 7, 8])('set level %p', (a) => {
    const kit = new VoximplantKitTest(callContext);
    const isSet = kit.setSkill('my_skill', a);
    console.log(isSet);
    test(`Should return false`, () => {
      expect(isSet).toEqual(false);
    });
  });
})

describe('setVariable', () => {
  describe('with call context', () => {
    const kit = new VoximplantKitTest(callContext);
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
      const  isCommit = await kit.dbCommit();
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
    process.env = { ...OLD_ENV };
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

describe('bindTags', () => {
  describe('with call context',  () => {
    let kit;

    beforeEach(() => kit = new VoximplantKitTest(callContext));

    test('Bind an array without numbers should return false', async () => {
      const isBind = await kit.bindTags(notNumber);
      expect(isBind).toEqual(false);
    });

    test('Binding not an array should return false', async () => {
      const isBind = await kit.bindTags({0: 'asda', d: 'aaa'});
      expect(isBind).toEqual(false);
    })

    test('should return true', async () => {
      const isBind = await kit.bindTags([15,1,8, 0, -1]);
      expect(isBind).toEqual(true);
    });

    test('result must be contain array with positive Int', async () => {
      const tags = await kit.getTags();
      const isBind = await kit.bindTags([15,1,8, 0, -1]);

      const expected = [...tags, 15,1,8]
      const response = kit.getResponseBody();
      expect(response.TAGS).toEqual(expect.arrayContaining(expected));
    })

  });

  describe('with message context',  () => {
    let kit;

    beforeEach(() => kit = new VoximplantKitTest(messageContext));

    test('Payload must be contain bind_tags command', async () => {
      await kit.bindTags([34]);
      await kit.bindTags([34, 53]);
      const {payload} = kit.getResponseBody();
      const expected = [{
        type: "cmd",
        name: "bind_tags",
        tags: [34, 53]
      }];
      expect(payload).toEqual(expect.arrayContaining(expected));
    });


  });
})
