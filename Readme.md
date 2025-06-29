# Identity Reconciliation Backend

A backend service that consolidates customer contact information by linking contacts with shared email addresses or phone numbers. The system maintains primary-secondary relationships where the oldest contact becomes primary and newer related contacts become secondary.

## Features

- RESTful API for identity reconciliation
- PostgreSQL database integration
- Contact linking logic based on email and phone number
- Clean, modular, and scalable code architecture
- Rate limiting and security middleware

## Tech stack
- Node.js, express.js (backend hosted on render)
- Typescript
- Prisma ORM
- postgreSQL (hosted on render)

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


## API Endpoint

### POST /contact/identify

Identifies and consolidates customer contacts based on email and/or phone number.

**Request Body:**
```
{
 "email": "string (optional)",
 "phoneNumber": "string (optional)"
}
```
Response:
```
{
  "contact": {
    "primaryContactId": "number",
    "emails": ["string[]"],
    "phoneNumbers": ["string[]"], 
    "secondaryContactIds": ["number[]"]
  }
}
```
### Behavior:

Creates new primary contact if no matches found
Links existing contacts that share email or phone
Merges separate contact chains when request spans multiple chains
Returns consolidated contact information
Does not create duplicates for existing information

## Service Functions
1. `identifyContact(email?, phoneNumber?)`
Main orchestration function for contact identification.
- Parameters:
```
email: Optional email string
phoneNumber: Optional phone string

Returns: ContactResponse with consolidated data
```
- Process:
  - Finds matching contacts
  - Analyzes primary relationships
  - Creates new contacts if needed
  - Returns consolidated response

2. `createNewPrimaryContact(email?, phoneNumber?)`
- Creates primary contact for new customers.
- Parameters:
```
email: Optional email string
phoneNumber: Optional phone string

Returns: ContactResponse with new primary
```

3. `analyzePrimaryContact(matchingContacts, email?, phoneNumber?)`
  - Determines primary contact and merge requirements.
  - Parameters:
   ```
   matchingContacts: Array of found contacts
   email: Optional email string
   phoneNumber: Optional phone string

   Returns: Primary contact and creation flag
   ```

4. `checkIfNewSecondaryNeeded(primaryContactId, email?, phoneNumber?)`
  - Checks if request contains new information.
  - Parameters:
  ```
   primaryContactId: Primary contact ID number
   email: Optional email string
   phoneNumber: Optional phone string

   Returns: Boolean indicating new contact needed
  ```

5. `mergePrimaryContacts(primaryIds, email?, phoneNumber?)`
  - Merges multiple primary contacts into one.
  - Parameters:
  ```
   primaryIds: Array of primary IDs
   email: Optional email string
   phoneNumber: Optional phone string

   Returns: Merged primary and creation flag
  ```

6. `buildConsolidatedResponse(primaryContactId)`
  - Builds final response with all contact data.
  - Parameters:
  ```
   primaryContactId: Primary contact ID number

   Returns: Formatted ContactResponse object
  ```

## Repository Functions
1. `findMatchingContacts(email?, phoneNumber?)`
  - Finds contacts matching email or phone.
  - Parameters:
  ```
email: Optional email string
phoneNumber: Optional phone string

Returns: Array of matching contacts
  ```

2. `getAllLinkedContacts(primaryContactId)`
  - Gets all contacts in a chain.
  - Parameters:
```
primaryContactId: Primary contact ID number

Returns: Array of linked contacts
```

3. `createContact(contactData)`
  - Creates new contact record.
  - Parameters:
```
contactData: Contact creation object

Returns: Created contact object
```

4. `makeContactSecondary(contactId, primaryContactId)`
  - Converts primary contact to secondary.
  - Parameters:
```
contactId: Contact ID to convert
primaryContactId: New primary ID reference

Returns: Updated contact object
```

5. `updateSecondaryContactsToNewPrimary(oldPrimaryId, newPrimaryId)`
  - Updates secondary contacts to new primary.
  - Parameters:
```
oldPrimaryId: Previous primary ID number
newPrimaryId: New primary ID number

Returns: Void (bulk update operation)
```
