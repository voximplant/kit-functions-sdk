import { ContextObject } from "./types";
import * as dotenv from 'dotenv'
const path = require('path');

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
    const directory = path.resolve(__dirname, '../../../../')
    const result = dotenv.config({ path: directory  + '/.env' });
    if (result.error) {
      throw result.error;
    }

  }catch (err) {
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
