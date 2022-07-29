const axios = require('axios');
const {default: Api} = require("../dist/Api");
const {notString} = require("./constants");
const Avatar = require("../dist/Avatar").default;

jest.mock('axios');
const mocRequest = jest.fn();

const avatarRequestConfig = {
  callbackUri: 'callbackUri',
  voxAccountId: 'voxAccountId',
  avatarLogin: 'avatarLogin',
  avatarPass: 'avatarPass',
  avatarId: 'avatarId',
  conversationId: 'conversationId',
  utterance: 'text',
  customData: {}
}

axios.create.mockImplementation(() => {
  return {
    post: mocRequest,
  }
})
jest.mock("axios");


describe('new Avatar', () => {
  test('Call with all parameters returns an Api instance', () => {
    const api = new Avatar('domain', 'token',);
    expect(api).toBeInstanceOf(Avatar);
  });
});

describe('parseJwt', () => {
  const avatar = new Avatar('avatarApi', 'imApi');

  describe('call with an invalid token', () => {
    const parsedToken = avatar.parseJwt('tttt');
    test('should return null', () => {
      expect(parsedToken).toBeNull();
    });
  })

  describe('Сall without a token', () => {
    const parsedToken = avatar.parseJwt();
    test('should return null', () => {
      expect(parsedToken).toBeNull();
    });
  })

  describe('Call with valid a token', () => {
    const parsedToken = avatar.parseJwt('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzNDU2Nzg5LCJuYW1lIjoiSm9zZXBoIn0.OpOSSw7e485LOP5PrzScxHb7SR6sAOMRckfFwi4rp7o');
    const expected = {"id": 123456789, "name": "Joseph"}
    test('should return true', () => {
      expect(parsedToken).toEqual(expected);
    });
  })
})


describe('sendMessageToAvatar', () => {
  const avatar = new Avatar('avatarApi', 'imApi');

  describe('A call with valid parameters', () => {
    test('Api must be called 2 times', async () => {
      mocRequest.mockResolvedValue({data: {jwt: 'asdasdasddasd.asdasdas.asdasd'}});
      await avatar.sendMessageToAvatar(avatarRequestConfig);
      expect(mocRequest.mock.calls.length).toEqual(2);
    })
  })

  describe('Received invalid token', () => {
    mocRequest.mockResolvedValue({data: {jwt: null}});
    test('Invalid token received', async () => {
      mocRequest.mockResolvedValue({data: {jwt: null}});
      try {
        await avatar.sendMessageToAvatar(avatarRequestConfig);
      } catch (e) {
        expect(e.message).toMatch('Failed to log in');
      }
    })
  });

  describe('Calling without mandatory config parameters', () => {
    test('Checking the error message', async () => {
      try {
        await avatar.sendMessageToAvatar({avatarId: 'dddd'});
      } catch (e) {
        expect(e.message).toMatch('Missing the required');
      }
    })

    test('An exception should be thrown', async () => {
      await expect(avatar.sendMessageToAvatar({avatarId: 'dddd'})).rejects.toThrow()
    })
  })
})

describe('sendMessageToConversation', () => {
  const avatar = new Avatar('avatarApi', 'imApi');

  test('Check the bot api url', async () => {
    const url = `imApi/api/v3/botService/sendResponse?conversation_uuid=my_uuid`
    await avatar.sendMessageToConversation('my_uuid', {})
    expect(axios.post.mock.calls[0][0]).toBe(url);
    expect(axios.post.mock.calls[0][1]).toStrictEqual({});
  })

  test('check promise reject', async () => {
    axios.post.mockRejectedValue(new Error('request filed'))
    await expect(avatar.sendMessageToConversation('my_uuid', {})).rejects.toThrow()
  })
})
