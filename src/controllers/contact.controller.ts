import { Request, Response } from "express";
import contactService from "../services/contact.service";
import { IdentifyRequestBody } from "../types/contact.types";

export class ContactController {
  async identify(req: Request, res: Response): Promise<void> {
    try {
      const { email, phoneNumber } = req.body as IdentifyRequestBody;

      const normalisedEmail = email ? String(email).trim() : null;
      const normalisedPhone = phoneNumber
        ? String(phoneNumber).trim()
        : null;

      if (!normalisedEmail && !normalisedPhone) {
        res.status(400).json({
          error: "At least one of email or phoneNumber must be provided.",
        });
        return;
      }

      const result = await contactService.handleIdentify(
        normalisedEmail,
        normalisedPhone
      );

      res.status(200).json(result);
    } catch (err) {
      console.error("Error in /identify:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new ContactController();
