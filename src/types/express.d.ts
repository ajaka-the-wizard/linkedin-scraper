import "express";

// Augment Express Request interface to include requestId
declare global {
    namespace Express {
        interface Request {
            id?: string;
        }
    }
}