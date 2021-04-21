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


describe('getDB', () => {
  const api = new Api.default();
  const db = new DB.default(api);

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
  const api = new Api.default();
  const db = new DB.default(api);

  test('Scope must be written', async () => {
    const funcResponse = {result: JSON.stringify({name: 'test'})};
    const accResponse = {result: JSON.stringify({client: 'test'})};
    const convResponse = {result: JSON.stringify({phone: 'test'})};
    axios.default.all.mockResolvedValue([funcResponse, accResponse, convResponse]);

    await db.getAllDB([])
    expect(db.scope).toEqual(expect.objectContaining({
        "conversation": {"phone": "test"},
        "function": {"name": "test"},
        "global": {"client": "test"}
      }
    ));
  })
})

