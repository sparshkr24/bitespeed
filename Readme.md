# Identity Reconciliation Backend

A Node.js backend service for identity reconciliation using PostgreSQL database. This service helps identify and link customer contacts across multiple purchases with different email addresses and phone numbers.

## Features

- RESTful API for identity reconciliation
- PostgreSQL database integration
- Contact linking logic based on email and phone number
- Clean, modular, and scalable code architecture
- Rate limiting and security middleware

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (hosted on Render.com or similar)
- npm or yarn package manager

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database credentials

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- **GET** `/health` - Check service status

### Identity Reconciliation
- **POST** `/identify` - Identify and reconcile customer contacts

## Database Schema

The service uses a `Contact` table with the following structure:

```sql
CREATE TABLE Contact (
    id SERIAL PRIMARY KEY,
    phoneNumber VARCHAR(20),
    email VARCHAR(255),
    linkedId INTEGER REFERENCES Contact(id),
    linkPrecedence VARCHAR(10) CHECK (linkPrecedence IN ('primary', 'secondary')),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP
);
```

## Project Structure

```
src/
├── app.ts                      # Main server file
├── config/                     # Configuration files
├── modules/                    # Route controllers
   ├── contact/                 # Project modules (for now only contact is present)
      ├── contactRoutes/        # Routes within specific module
      ├── contactControllers/   # Module controllers
      ├── contactServices/      # Business logic
      ├── contactRepositories/  # Database operations
├── routes/                     # API routes
└── utils/                      # Utility functions
```

## License

MIT
