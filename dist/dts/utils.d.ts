import { ContextObject } from "./types";
declare const _default: {
    clone: <T>(object: T) => T;
    getHeaderValue: (context: ContextObject, name: string, defaultValue: string | number) => string | number;
    getEnv: () => void;
    getEnvVariable: (name: string) => string;
    getVersion: () => string | void;
};
/**
 * @hidden
 */
export default _default;
