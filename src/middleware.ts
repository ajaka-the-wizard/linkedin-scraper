import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger.js";


export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
};

/**
 * Middleware for structured HTTP request/response logging
 */
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const reqId = req.id;

  logger.info(
    {
      reqId,
      method: req.method,
      url: req.originalUrl || req.url,
    },
    "Incoming request"
  );

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      {
        reqId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      "Request completed"
    );
  });

  next();
};
