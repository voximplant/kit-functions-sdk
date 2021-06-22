import { ContextObject } from "./types";
import * as dotenv from 'dotenv'

const fs = require('fs');

/**
 * @hidden
 */
const clone = <T>(object: T): T => {
  return JSON.parse(JSON.stringify(object));
}

/**
 * @hidden
 */
const getHeaderValue = (context: ContextObject, name: string, defaultValue: string | number) => {
  return (typeof context.request.headers[name] !== "undefined") ? context.request.headers[name] : defaultValue;
}

/**
 * @hidden
 */
const getEnv = function getEnv(): void {
  try {
    const directory = '/userfunc/deployarchive/.env';

    if (fs.existsSync(directory)) {
      const result = dotenv.config({ path: directory });
      if (result.error) {
        throw result.error;
      }
    } else {
      console.log('The path to the .env file could not be found');
    }
  } catch (err) {
    console.log(err);
  }
}

/**
 * @hidden
 */
export default {
  clone,
  getHeaderValue,
  getEnv,
}
