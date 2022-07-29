import { ContextObject } from "./types";
import * as dotenv from 'dotenv'
import * as path from "path";

/**
 * @hidden
 */
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
  /* istanbul ignore next */
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

const getEnvVariable = function getEnvVariable(name: string): string | null {
  if (typeof name === 'string') {
    return name in process.env ? process.env[name] : null;
  } else {
    return null;
  }
}

/**
 * @hidden
 */
const getVersion = function getVersion(): string | void {
  const packageJson = path.resolve(__dirname, '../package.json');

  try {
    if (fs.existsSync(packageJson)) {
      const json = JSON.parse(fs.readFileSync(packageJson, 'utf8'))
      return json.version;
    } else {
      return;
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
  getEnvVariable,
  getVersion
}
