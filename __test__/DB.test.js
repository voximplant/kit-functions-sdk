const Api = require('../dist/Api');
const DB = require('../dist/DB.js');
const axios = require('axios');
const {
  notStringAndNumber,
  notString,
  notNumber
} = require('./constants');

jest.mock('axios');

jest.mock('../dist/Api');
const apiMock = jest.fn();
Api.default.mockImplementation(() => {
  return {
    request: apiMock
  }
});

let api, db;
const funcResponse = {result: JSON.stringify({name: 'test'})};
const accResponse = {result: JSON.stringify({client: 'test'})};
const convResponse = {result: JSON.stringify({phone: 'test'})};

beforeEach(() => {
  api = new Api.default();
  db = new DB.default(api);
});


describe('getDB', () => {
  test('The response must contain an object with the result property', () => {
    const expected = {
      result: JSON.stringify({})
    };
    apiMock.mockResolvedValue({data: expected});
    return db.getDB('name').then(data => expect(data).toEqual(expect.objectContaining({
      result: expect.any(String)
    }),));
  })
})

describe('getAllDB', () => {
  test('Scope must be written', async () => {

    axios.default.all.mockResolvedValue([funcResponse, accResponse, convResponse]);

    await db.getAllDB([])
    expect(db.scope).toEqual(expect.objectContaining({
        "conversation": {"phone": "test"},
        "function": {"name": "test"},
        "global": {"client": "test"}
      }
    ));
  });

  test('A dropped request will not change the scope', async () => {
    axios.default.all.mockRejectedValue(new Error());
    await db.getAllDB([]);
    expect(db.scope).toEqual(expect.objectContaining({
        "conversation": {},
        "function": {},
        "global": {}
      }
    ));
  });
});

describe('putDB', () => {
  test('If a nonexistent type is passed scope returns false', () => {
    return db.putDB('functions', 'test')
      .catch(e => expect(e).toMatch('DB test not found'));
  });

  test('A successful request will return an object containing the result property with string', () => {
    apiMock.mockResolvedValue({data: {result: ''}});
    return db.putDB('functions_name', 'function').then(res => {
      expect(res).toEqual(expect.objectContaining({result: expect.any(String)}))
    })
  });

  test('A failure request will return an object containing the result property with null', () => {
    apiMock.mockRejectedValue(new Error('failure request'));
    return db.putDB('functions_name', 'function').catch(res => {
      console.log(res);
      expect(res).toMatch('failure request');
    });
  });
});

describe('putAllDB', () => {
  test('Should return true', async () => {
    axios.default.all.mockResolvedValue([funcResponse, accResponse, convResponse]);
    const result = await db.putAllDB([]);
    expect(result).toEqual(true);
  });

  test('A dropped request will return false', async () => {
    axios.default.all.mockRejectedValue(new Error());
    const result = await db.putAllDB([]);
    expect(result).toEqual(false);
  });
});

describe('getScopeValue', () => {
  test('with valid key and scope, should return string test', async () => {
    axios.default.all.mockResolvedValue([funcResponse, accResponse, convResponse]);
    await db.getAllDB([]);

    const valueFromGlobal = db.getScopeValue('client');
    const valueFromGlobal2 = db.getScopeValue('client', 'global');
    const valueFromFunc = db.getScopeValue('name', 'function');
    const valueFromConv = db.getScopeValue('phone', 'conversation');

    expect(valueFromGlobal).toEqual(expect.any(String));
    expect(valueFromGlobal2).toEqual(expect.any(String));
    expect(valueFromFunc).toEqual(expect.any(String));
    expect(valueFromConv).toEqual(expect.any(String));
  });

  describe.each(['key', true, false, null, undefined, {}, [], 111, Infinity, NaN])('Get with invalid key %p', (a) => {
    axios.default.all.mockResolvedValue([funcResponse, accResponse, convResponse]);

    test('Should return null', async () => {
      await db.getAllDB([]);
      const valueFromGlobal = db.getScopeValue(a);
      const valueFromFunc = db.getScopeValue(a, 'function');
      const valueFromConv = db.getScopeValue(a, 'conversation');

      expect(valueFromGlobal).toBeNull();
      expect(valueFromFunc).toBeNull();
      expect(valueFromConv).toBeNull();
    })
  })

  describe.each(['key', true, false, null, undefined, {}, [], 111, Infinity, NaN])('Get from invalid scope %p', (a) => {
    axios.default.all.mockResolvedValue([funcResponse, accResponse, convResponse]);

    test('Should return null', async () => {
      await db.getAllDB([]);
      const valueFromGlobal = db.getScopeValue('name', a);

      expect(valueFromGlobal).toBeNull();
    });
  });
});

describe('setScopeValue', () => {
  describe.each([undefined, 'global', 'function', 'conversation'])('With valid scope %p', (scope) => {
    const api = new Api.default();
    const db = new DB.default(api);
    const isSet = db.setScopeValue('key', 'value', scope);
    const value = db.getScopeValue('key', scope);

    test('set valid key and value should return true', () => {
      expect(isSet).toEqual(true);
    });

    test('value to be equal string \'value\'', () => {
      expect(value).toEqual('value');
    })
  })

  describe.each(notNumber)('With invalid scope %p', (scope) => {
    const api = new Api.default();
    const db = new DB.default(api);
    const isSet = db.setScopeValue('key', 'value', scope);

    test('set valid key and value should return false', () => {
      expect(isSet).toEqual(false);
    });
  });

  describe.each(notString)('set invalid key %p', (key) => {
    const api = new Api.default();
    const db = new DB.default(api);
    const isSet = db.setScopeValue(key, 'value', 'global');

    test('Should return false', () => {
      expect(isSet).toEqual(false)
    })

    test(`Scope must not contain a key ${key}`, () => {
      expect(`${key}` in db.scope).toEqual(false)
    })
  })

  describe.each(notString)('set not string value %p', (value) => {
    let api, db, isSet;
    beforeEach(() => {
      api = new Api.default();
      db = new DB.default(api);
      isSet = db.setScopeValue('test_key', value, 'global');
    });

    test('Should return false', () => {
      const isSet = db.setScopeValue('test_key', value, 'global');
      expect(isSet).toEqual(true)
    })

    test(`Scope must not contain a key ${value}`, () => {
      const val = db.getScopeValue('test_key', 'global');
      expect(val).toEqual(`${value}`);
    })
  });
});

describe('getScopeAllValues', () => {
  describe.each([undefined, 'global', 'function', 'conversation'])('With valid scope %p', (scope) => {
    test('set valid key and value should return true', () => {
      const isSet = db.setScopeValue('key', 'value', scope);
      expect(isSet).toEqual(true);
    });

    test('the result must contain a key and a value', () => {
      db.setScopeValue('key', 'value', scope);
      const result = db.getScopeAllValues(scope);
      expect(result).toEqual(expect.objectContaining({key: 'value'}));
    });
  });

  describe.each(notNumber)('With invalid scope %p', (scope) => {
    test('set valid key and value should return false', () => {
      db.setScopeValue('key', 'value', scope);
      const values = db.getScopeAllValues('key', 'value', scope);
      expect(values).toBeNull();
    });
  });
});





