declare module "pino" {
  export interface Logger {
    info(msg: string, ...args: any[]): void;
    info(obj: object, msg?: string, ...args: any[]): void;
    error(msg: string, ...args: any[]): void;
    error(obj: object, msg?: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    warn(obj: object, msg?: string, ...args: any[]): void;
    debug(msg: string, ...args: any[]): void;
    debug(obj: object, msg?: string, ...args: any[]): void;
  }

  export interface LoggerOptions {
    name?: string;
    level?: string;
    transport?: any;
  }

  export default function pino(options?: LoggerOptions): Logger;
}
