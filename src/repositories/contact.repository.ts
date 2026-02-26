import { Contact, LinkPrecedence } from "@prisma/client";
import prismaClient from "../config/database";

export class ContactRepository {
  async findByEmailOrPhone(
    email: string | null,
    phoneNumber: string | null
  ): Promise<Contact[]> {
    const conditions: object[] = [];

    if (email) conditions.push({ email });
    if (phoneNumber) conditions.push({ phoneNumber });
    if (conditions.length === 0) return [];

    return prismaClient.contact.findMany({
      where: {
        deletedAt: null,
        OR: conditions,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(id: number): Promise<Contact | null> {
    return prismaClient.contact.findUnique({ where: { id } });
  }

  async findSecondariesByLinkedId(primaryId: number): Promise<Contact[]> {
    return prismaClient.contact.findMany({
      where: {
        linkedId: primaryId,
        linkPrecedence: LinkPrecedence.secondary,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(data: {
    email?: string | null;
    phoneNumber?: string | null;
    linkedId?: number | null;
    linkPrecedence: LinkPrecedence;
  }): Promise<Contact> {
    return prismaClient.contact.create({
      data: {
        email: data.email ?? null,
        phoneNumber: data.phoneNumber ?? null,
        linkedId: data.linkedId ?? null,
        linkPrecedence: data.linkPrecedence,
      },
    });
  }

  // Demote a primary to secondary under a new primary
  async demoteToPrimary(
    contactId: number,
    newPrimaryId: number
  ): Promise<Contact> {
    return prismaClient.contact.update({
      where: { id: contactId },
      data: {
        linkedId: newPrimaryId,
        linkPrecedence: LinkPrecedence.secondary,
      },
    });
  }

  // Re-link all secondaries from old primary to new primary
  async relinkSecondaries(
    oldPrimaryId: number,
    newPrimaryId: number
  ): Promise<void> {
    await prismaClient.contact.updateMany({
      where: {
        linkedId: oldPrimaryId,
        deletedAt: null,
      },
      data: {
        linkedId: newPrimaryId,
      },
    });
  }
}

export default new ContactRepository();
