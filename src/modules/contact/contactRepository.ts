import { Contact, PrismaClient, LinkPrecedence } from '@prisma/client';
import { getPrismaClient } from '../../config/db.js';
interface CreateContactData {
  email?: string;
  phoneNumber?: string;
  linkedId?: number | null;
  linkPrecedence: LinkPrecedence;
}

export const findMatchingContacts = async (
  email?: string,
  phoneNumber?: string
): Promise<Contact[]> => {
  try {
    const prisma: PrismaClient = getPrismaClient();

    const whereConditions: { email?: string; phoneNumber?: string }[] = [];
    if (email) whereConditions.push({ email });
    if (phoneNumber) whereConditions.push({ phoneNumber });

    if (whereConditions.length === 0) return [];

    return await prisma.contact.findMany({
      where: {
        OR: whereConditions,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  } catch (error) {
    console.error('Error finding matching contacts:', error);
    throw new Error('Failed to find matching contacts');
  }
};

export const getAllLinkedContacts = async (
  primaryContactId: number
): Promise<Contact[]> => {
  try {
    const prisma: PrismaClient = getPrismaClient();
    
    return await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContactId },
          { linkedId: primaryContactId },
        ],
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  } catch (error) {
    console.error('Error getting linked contacts:', error);
    throw new Error('Failed to get linked contacts');
  }
};

export const createContact = async (
  contactData: CreateContactData
): Promise<Contact> => {
  try {
    const prisma: PrismaClient = getPrismaClient();

    return await prisma.contact.create({
      data: {
        email: contactData.email || null,
        phoneNumber: contactData.phoneNumber || null,
        linkedId: contactData.linkedId || null,
        linkPrecedence: contactData.linkPrecedence,
      },
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    throw new Error('Failed to create contact');
  }
};

export const makeContactSecondary = async (
  contactId: number,
  primaryContactId: number
): Promise<Contact> => {
  try {
    const prisma: PrismaClient = getPrismaClient();

    return await prisma.contact.update({
      where: { id: contactId },
      data: {
        linkedId: primaryContactId,
        linkPrecedence: LinkPrecedence.secondary,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error making contact secondary:', error);
    throw new Error('Failed to update contact');
  }
};

export const updateSecondaryContactsToNewPrimary = async (
  oldPrimaryId: number,
  newPrimaryId: number
): Promise<void> => {
  try {
    const prisma: PrismaClient = getPrismaClient();
    
    await prisma.contact.updateMany({
      where: {
        linkedId: oldPrimaryId,
        deletedAt: null,
      },
      data: {
        linkedId: newPrimaryId,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating secondary contacts:', error);
    throw new Error('Failed to update secondary contacts');
  }
};
