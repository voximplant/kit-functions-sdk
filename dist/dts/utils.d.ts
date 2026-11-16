import { ContextObject, ObjectType } from "./types";
/**
 * @hidden
 */
declare const _default: {
    clone: <T>(object: T) => T;
    getHeaderValue: (context: ContextObject, name: string, defaultValue: string | number) => string | number;
    getEnv: () => void;
    getEnvVariable: (name: string) => string | null;
    getVersion: () => string | void;
    getDfKey: (id: number) => ObjectType | null;
    getDfKeysList: () => string[];
    isObject: (item: any) => boolean;
};
export default _default;
