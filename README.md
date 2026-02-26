# Bitespeed Identity Reconciliation Service

A web service that identifies and links customer contacts across multiple purchases, even when different email addresses and phone numbers are used.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL (Neon)

## Project Structure

```
src/
├── config/
│   └── database.ts          # Prisma client singleton
├── controllers/
│   └── contact.controller.ts # Request handling & validation
├── repositories/
│   └── contact.repository.ts # Database access layer
├── routes/
│   └── contact.routes.ts     # Route definitions
├── services/
│   └── contact.service.ts    # Core business logic
├── types/
│   └── contact.types.ts      # Shared TypeScript interfaces
├── app.ts                    # Express app factory
└── server.ts                 # Entry point
```

## Setup & Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Set your database URL in .env
echo 'DATABASE_URL=your_postgres_url' > .env

# 3. Push schema to database & generate Prisma client
npx prisma db push

# 4. Build & start
npm run build
npm start
```

The server starts on `http://localhost:3000` by default.

## API Endpoint

### `POST /identify`

**Request Body** (JSON):
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

At least one of `email` or `phoneNumber` must be provided.

**Response** (200 OK):
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["123456", "789012"],
    "secondaryContactIds": [2, 3]
  }
}
```

## How It Works

1. **New customer** — If no existing contact matches, a new `primary` contact is created.
2. **Returning customer with new info** — If either email or phone matches an existing contact but the other field is new, a `secondary` contact is created and linked to the primary.
3. **Merging two identities** — If the request links two previously separate primary contacts (e.g., email belongs to one primary, phone to another), the newer primary is demoted to `secondary` and all its linked contacts are re-pointed to the older primary.

## Hosted Endpoint

> **URL:** `https://backend-table-idx.vercel.app/identify`
_
