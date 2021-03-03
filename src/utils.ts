import { ContextObject, ObjectType } from "./types";

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
export default {
  clone,
  getHeaderValue
}