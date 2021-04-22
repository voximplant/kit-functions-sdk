const Api = require('../dist/Api');
const DB = require('../dist/DB.js');
const axios = require('axios');

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
  test.only('If a nonexistent type is passed scope returns false',  () => {

    return db.putDB('functions', 'test')
      .catch(e => expect(e).toMatch('DB test not found'));
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


