import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import prismaClient from "./config/database";

const PORT = process.env.PORT || 3000;

async function bootstrap(): Promise<void> {
  await prismaClient.$connect();
  console.log("Database connected");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
