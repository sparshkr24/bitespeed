import { Request, Response } from "express";

export const baseRouteHandler = (req: Request, res: Response) => {
  res.send('Hello from your Express server!');
}

export const healthCheckHandler = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Identity Reconciliation API',
  });
}