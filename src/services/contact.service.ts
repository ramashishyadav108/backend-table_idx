import { Contact, LinkPrecedence } from "@prisma/client";
import contactRepository from "../repositories/contact.repository";
import {
  ConsolidatedContact,
  IdentifyResponse,
} from "../types/contact.types";

export class ContactService {
  async handleIdentify(
    email: string | null,
    phoneNumber: string | null
  ): Promise<IdentifyResponse> {
    const matchingContacts = await contactRepository.findByEmailOrPhone(
      email,
      phoneNumber
    );

    // No match — new customer
    if (matchingContacts.length === 0) {
      const freshContact = await contactRepository.create({
        email,
        phoneNumber,
        linkPrecedence: LinkPrecedence.primary,
      });
      return this.buildResponse(freshContact, []);
    }

    // Resolve each match to its root primary
    const primaryMap = await this.resolvePrimaryContacts(matchingContacts);
    const distinctPrimaries = [...primaryMap.values()];

    // Merge if two separate primaries were found
    const rootPrimary = await this.mergeIfNeeded(distinctPrimaries);

    // Create secondary if request carries new info
    await this.createSecondaryIfNew(rootPrimary, email, phoneNumber);

    const allSecondaries = await contactRepository.findSecondariesByLinkedId(
      rootPrimary.id
    );
    return this.buildResponse(rootPrimary, allSecondaries);
  }

  // Walk each contact up to its root primary
  private async resolvePrimaryContacts(
    contacts: Contact[]
  ): Promise<Map<number, Contact>> {
    const primaries = new Map<number, Contact>();

    for (const contact of contacts) {
      let root = contact;
      if (root.linkPrecedence === LinkPrecedence.secondary && root.linkedId) {
        const parent = await contactRepository.findById(root.linkedId);
        if (parent) root = parent;
      }
      primaries.set(root.id, root);
    }

    return primaries;
  }

  // Demote newer primary to secondary of the older one
  private async mergeIfNeeded(primaries: Contact[]): Promise<Contact> {
    if (primaries.length <= 1) return primaries[0];

    primaries.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    const keeper = primaries[0];
    const demotee = primaries[1];

    await contactRepository.relinkSecondaries(demotee.id, keeper.id);
    await contactRepository.demoteToPrimary(demotee.id, keeper.id);

    return keeper;
  }

  // Insert a secondary only if the request has genuinely new info
  private async createSecondaryIfNew(
    primary: Contact,
    email: string | null,
    phoneNumber: string | null
  ): Promise<void> {
    const secondaries = await contactRepository.findSecondariesByLinkedId(
      primary.id
    );
    const group = [primary, ...secondaries];

    const emailAlreadyExists =
      !email || group.some((c) => c.email === email);
    const phoneAlreadyExists =
      !phoneNumber || group.some((c) => c.phoneNumber === phoneNumber);

    if (emailAlreadyExists && phoneAlreadyExists) return;

    await contactRepository.create({
      email,
      phoneNumber,
      linkedId: primary.id,
      linkPrecedence: LinkPrecedence.secondary,
    });
  }

  private buildResponse(
    primary: Contact,
    secondaries: Contact[]
  ): IdentifyResponse {
    const emails = this.collectUnique(
      [primary, ...secondaries],
      (c) => c.email
    );
    const phoneNumbers = this.collectUnique(
      [primary, ...secondaries],
      (c) => c.phoneNumber
    );

    return {
      contact: {
        primaryContatctId: primary.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaries.map((s) => s.id),
      },
    };
  }

  // Extract unique non-null values, primary's value first
  private collectUnique(
    contacts: Contact[],
    accessor: (c: Contact) => string | null
  ): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const contact of contacts) {
      const value = accessor(contact);
      if (value && !seen.has(value)) {
        seen.add(value);
        result.push(value);
      }
    }

    return result;
  }
}

export default new ContactService();
