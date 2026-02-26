import express, { Application, Request, Response } from "express";
import contactRouter from "./routes/contact.routes";

const app = express();

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "healthy", service: "Bitespeed Identity Reconciliation" });
});

app.use(contactRouter);

export default app;
