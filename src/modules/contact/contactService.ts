// contactService.ts
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
        linkPrecedence: 'secondary',
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
    linkPrecedence: 'primary',
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
  matchingContacts: any[],
  email?: string,
  phoneNumber?: string
): Promise<{ primaryContact: any; needsNewSecondary: boolean }> => {
  const primaryContacts = matchingContacts.filter(c => c.linkPrecedence === 'primary');
  const secondaryContacts = matchingContacts.filter(c => c.linkPrecedence === 'secondary');

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
        .then(contacts => contacts.find(c => c.linkPrecedence === 'primary')));

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
  const allLinked: any[] = await contactRepository.getAllLinkedContacts(primaryContactId);
  return !allLinked.some(c => c.email === email && c.phoneNumber === phoneNumber);
};

const mergePrimaryContacts = async (
  primaryIds: number[],
  email?: string,
  phoneNumber?: string
): Promise<{ primaryContact: any; needsNewSecondary: boolean }> => {
  let oldestPrimary: any | null = null;
  for (const id of primaryIds) {
    const contacts = await contactRepository.getAllLinkedContacts(id);
    const primary = contacts.find(c => c.linkPrecedence === 'primary');
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
  const primary = allLinked.find(c => c.linkPrecedence === 'primary');
  const secondaries = allLinked.filter(c => c.linkPrecedence === 'secondary');

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
