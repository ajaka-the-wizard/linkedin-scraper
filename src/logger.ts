import pino, { type LoggerOptions } from "pino";
import { Env } from "./env.js";

const isDev = Env.ENVIROMENT === "development";

const options: LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
};

if (isDev) {
  options.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  };
}

export const logger = pino(options);
