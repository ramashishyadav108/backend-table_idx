import { Router } from "express";
import contactController from "../controllers/contact.controller";

const contactRouter = Router();

contactRouter.post("/identify", (req, res) =>
  contactController.identify(req, res)
);

export default contactRouter;
