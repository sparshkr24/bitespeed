import { Request, Response, NextFunction } from 'express';
import { isValidEmail, isValidPhoneNumber } from '../../utils/index.js';
import { identifyContact } from './contactService.js';

export const identifyContactHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Either email or phoneNumber must be provided',
      });
      return;
    }

    if (email && !isValidEmail(email)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format',
      });
      return;
    }

    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid phone number format',
      });
      return;
    }

    const normalizedPhoneNumber = phoneNumber ? String(phoneNumber) : undefined;
    const result = await identifyContact(email, normalizedPhoneNumber);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in identifyContactHandler:', error);
    next(error); // pass to global error handler
  }
};
