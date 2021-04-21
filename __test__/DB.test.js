const Api = require('../dist/Api');
const axios = require('axios');
const DB = require('../dist/DB.js');

jest.mock('../dist/Api');
const apiMock = jest.fn();
Api.default.mockImplementation(() => {
  return {
    request: apiMock
  }
});

jest.mock('axios');

describe.only('getDB', () => {
  const api = new Api.default();
  const db = new DB.default(api);

  test('Should contain result', () => {
    const expected = {
      result: '{}'
    };
    apiMock.mockResolvedValue({data: expected});
    return db.getDB().then(data => expect(data).toEqual(expect.objectContaining({
      result: expect.any(String)
    }),));
  })

})