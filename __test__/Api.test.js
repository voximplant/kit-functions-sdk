const Api = require('../dist/Api').default;
const {notString} = require('./constants');
const axios = require('axios');


jest.mock('axios');
const mocRequest = jest.fn();
axios.create.mockImplementation(() => {
  return {
    interceptors: {
      request: {
        use: jest.fn()
      }
    },
    request: mocRequest
  }
})


describe('new Api', () => {
  test('call with all parameters return instanse of Api', () => {
    const api = new Api('domain', 'token', 'url');
    expect(api).toBeInstanceOf(Api);
  });

  test('calling the constructor with missing parameters will return an error', () => {
    expect(() => Api()).toThrow(Error);
    expect(() => new Api()).toThrow(Error);
    expect(() => new Api).toThrow(Error);
    expect(() => new Api('token', 'domain', 'url').__proto__.constructor()).toThrow(Error);
    expect(() => new Api('domain')).toThrow(Error);
    expect(() => new Api('domain', 'token')).toThrow(Error);
  });

  describe.each(notString)('set not a string parameter %p throw an error', (param) => {
    expect(() => new Api(param, param, param)).toThrow(Error);
    expect(() => new Api('domain', 'token', param)).toThrow(Error);
    expect(() => new Api('domain', param, 'url')).toThrow(Error);
    expect(() => new Api(param, 'token', 'url')).toThrow(Error);
  });
});

describe('request', () => {
  test('Must return the response', async () => {
    mocRequest.mockResolvedValue({result: true});
    const api = new Api('domain', 'token', 'url');
    const result = await api.request('url');

    expect(result).toEqual(expect.objectContaining({result: true}))
  })

  test('Must return the error',  () => {
    mocRequest.mockRejectedValue('Error response');
    const api = new Api('domain', 'token', 'url');
    api.request('url').catch(err => {
      expect(err).toMatch('Error response');
    });
  })

 test('call without url param throw Error', () => {
   const api = new Api('domain', 'token', 'url');
   expect( () =>  api.request()).toThrow(Error);
   expect( () =>  api.request()).toThrow('url parameter is not passed or is not a string');
 });
});