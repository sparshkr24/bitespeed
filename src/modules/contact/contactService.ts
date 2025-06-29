import { Contact, LinkPrecedence } from '@prisma/client';
import * as contactRepository from './contactRepository.js';

interface ContactResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export const identifyContact = async (
  email?: string,
  phoneNumber?: string
): Promise<ContactResponse> => {
  try {
    const matchingContacts = await contactRepository.findMatchingContacts(email, phoneNumber);

    if (matchingContacts.length === 0) {
      return await createNewPrimaryContact(email, phoneNumber);
    }

    const { primaryContact, needsNewSecondary } = await analyzePrimaryContact(
      matchingContacts,
      email,
      phoneNumber
    );

    if (needsNewSecondary) {
      await contactRepository.createContact({
        email,
        phoneNumber,
        linkedId: primaryContact.id,
        linkPrecedence: LinkPrecedence.secondary,
      });
    }

    return await buildConsolidatedResponse(primaryContact.id);
  } catch (error) {
    console.error('Error in identifyContact:', error);
    throw new Error('Identity reconciliation failed');
  }
};

const createNewPrimaryContact = async (
  email?: string,
  phoneNumber?: string
): Promise<ContactResponse> => {
  const newContact = await contactRepository.createContact({
    email,
    phoneNumber,
    linkedId: null,
    linkPrecedence: LinkPrecedence.primary,
  });

  return {
    contact: {
      primaryContactId: newContact.id,
      emails: newContact.email ? [newContact.email] : [],
      phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
      secondaryContactIds: [],
    },
  };
};

const analyzePrimaryContact = async (
  matchingContacts: Contact[],
  email?: string,
  phoneNumber?: string
): Promise<{ primaryContact: Contact; needsNewSecondary: boolean }> => {
  const primaryContacts = matchingContacts.filter(c => c.linkPrecedence === LinkPrecedence.primary);
  const secondaryContacts = matchingContacts.filter(c => c.linkPrecedence === LinkPrecedence.secondary);

  const primaryIds = new Set<number>();
  primaryContacts.forEach(c => primaryIds.add(c.id));
  secondaryContacts.forEach(c => {
    if (c.linkedId) primaryIds.add(c.linkedId);
  });

  const primaryIdArray = Array.from(primaryIds);
  if (primaryIdArray.length === 0) throw new Error('No primary contact found');

  if (primaryIdArray.length === 1) {
    const primaryContact =
      primaryContacts.find(c => c.id === primaryIdArray[0]) ||
      (await contactRepository
        .getAllLinkedContacts(primaryIdArray[0])
        .then(contacts => contacts.find(c => c.linkPrecedence === LinkPrecedence.primary)));

    if (!primaryContact) throw new Error('Primary contact not found');

    const needsNewSecondary = await checkIfNewSecondaryNeeded(primaryContact.id, email, phoneNumber);
    return { primaryContact, needsNewSecondary };
  }

  return await mergePrimaryContacts(primaryIdArray, email, phoneNumber);
};

const checkIfNewSecondaryNeeded = async (
  primaryContactId: number,
  email?: string,
  phoneNumber?: string
): Promise<boolean> => {
  const allLinked: Contact[] = await contactRepository.getAllLinkedContacts(primaryContactId);
  
  const existingEmails = new Set(allLinked.map(c => c.email).filter(Boolean));
  const existingPhones = new Set(allLinked.map(c => c.phoneNumber).filter(Boolean));
  
  const hasNewEmail = email && !existingEmails.has(email);
  const hasNewPhone = phoneNumber && !existingPhones.has(phoneNumber);
  
  // Only create new contact if there's actually new information
  return !!(hasNewEmail || hasNewPhone);
};

const mergePrimaryContacts = async (
  primaryIds: number[],
  email?: string,
  phoneNumber?: string
): Promise<{ primaryContact: Contact; needsNewSecondary: boolean }> => {
  let oldestPrimary: Contact | null = null;
  for (const id of primaryIds) {
    const contacts = await contactRepository.getAllLinkedContacts(id);
    const primary = contacts.find(c => c.linkPrecedence === LinkPrecedence.primary);
    if (primary && (!oldestPrimary || primary.createdAt < oldestPrimary.createdAt)) {
      oldestPrimary = primary;
    }
  }
  if (!oldestPrimary) throw new Error('Oldest primary not found');

  for (const id of primaryIds) {
    if (id !== oldestPrimary.id) {
      await contactRepository.makeContactSecondary(id, oldestPrimary.id);
      await contactRepository.updateSecondaryContactsToNewPrimary(id, oldestPrimary.id);
    }
  }

  const needsNewSecondary = await checkIfNewSecondaryNeeded(
    oldestPrimary.id,
    email,
    phoneNumber
  );
  
  return { primaryContact: oldestPrimary, needsNewSecondary };
};

const buildConsolidatedResponse = async (
  primaryContactId: number
): Promise<ContactResponse> => {
  const allLinked = await contactRepository.getAllLinkedContacts(primaryContactId);
  const primary = allLinked.find(c => c.linkPrecedence === LinkPrecedence.primary);
  const secondaries = allLinked.filter(c => c.linkPrecedence === LinkPrecedence.secondary);

  if (!primary) throw new Error('Primary contact not found for response');

  const emails = new Set<string>();
  const phones = new Set<string>();

  for (const contact of [primary, ...secondaries]) {
    if (contact.email) emails.add(contact.email);
    if (contact.phoneNumber) phones.add(contact.phoneNumber);
  }

  return {
    contact: {
      primaryContactId: primary.id,
      emails: Array.from(emails),
      phoneNumbers: Array.from(phones),
      secondaryContactIds: secondaries.map(c => c.id),
    },
  };
};
