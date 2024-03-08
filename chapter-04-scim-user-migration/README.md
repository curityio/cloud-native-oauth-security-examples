# OAuth User Migration

When moving to an OAuth architecture, start by designing migration of existing users to the authorization server.\
This example shows how to perform a migration using the System for Cross-domain Identity Management (SCIM).

## Data Sources

For simplicity, this example stores original business data in simple JSON files in the `data` folder.\
In a real organization the source data access would connect to a real database instead.

### Original Business Data

In this example, users are originally modeled as customer records containg both identity fields and business settings:

```json
{
    "id": 2099,
    "userName": "bob smith",
    "email": "bob.smith@example.com",
    "country": "US",
    "membershipLevel": "gold",
    "membershipExpires": "2024-10",
    "roles": [
        "customer"
    ]
}
```

These customer records are linked to existing business resources such as purchase records.\
The organization's APIs might use a customer ID, roles and the membership fields to authorize access to business data:

```json
[
    {
        "id": "20882",
        "customerId": "3044",
        "country": "US",
        "amountUsd": 1500,
        "date": "2024-06-12",
        "status": "pending"
    }
]
```

The original business data also contains some fine grained permissions associated to roles.\
These are left in the business data and can continue to be used for authorization.

```json
[
    {
        "name": "customer",
        "permissions": {
            "canUpdateDeliveryInfo": true,
            "canEditPrice": false,
            "canAccessAllPurchasesForRegion": false
        }
    },
    {
        "name": "admin",
        "permissions": {
            "canUpdateDeliveryInfo": true,
            "canEditPrice": true,
            "canAccessAllPurchasesForRegion": true
        }
    }
]
```

### Migrated User Accounts

Core identity fields and personal data related to regulations like GDPR are often migrated to the identity data.\
In this example the identity data will contain these fields, and can be viewed in SCIM format:

```json
[
  {
    "id": "VVNFUjoyN2Q1ZDZjZS0xNzQwLTRhMmQtOWY4ZS0yYTA5ZWMyODgxOGM",
    "userName": "bob.smith@example.com",
    "schemas": [
      "urn:ietf:params:scim:schemas:core:2.0:User",
      "urn:se:curity:scim:2.0:Devices"
    ],
    "active": true,
    "name": {
      "givenName": "bob",
      "familyName": "smith"
    },
    "emails": [
      {
        "value": "bob.smith@example.com",
        "primary": true
      }
    ],
    "addresses": [
      {
        "country": "US"
      }
    ],
    "roles": [
      {
        "value": "customer",
        "primary": true
      }
    ],
    "customerId": "2099"
  }
]
```

After the migration the customer records in the business data will be reduced to the following fields.\
The fine grained permissions associated to roles are also left in the business data.

```json
{
    "id": 2099,
    "membershipLevel": "gold",
    "membershipExpires": "2024-10"
}
```

## Run the Code Example

A Node.js console application is used to migrate users to the identity data.\
The console app can be pointed to any authorization server that supports SCIM 2.0 standards.

### Deploy an Authorization Server

By default, follow the [Deployment README](deployment/README.md) to run an instance of the Curity Identity Server.\
Alternatively, use a different choice of authorization server.

### Configure the Code Example

The Node.js app uses the client credentials flow to get an access token for a SCIM client.\
The default OAuth configuration settings can be overridden if using a different authorization server:

```json
{
    "clientId": "scim-client",
    "clientSecret": "Password1",
    "scope": "accounts",
    "tokenEndpoint": "http://localhost:8443/oauth/v2/oauth-token",
    "scimEndpoint": "http://localhost:8443/scim/Users"
}
```

### Do the Migration

The program can be safely run multiple times if needed, and the simple migration code can be studied:

```bash
npm install
npm run migrate
```

This access token includes the accounts scope, which is required in the example setup to call SCIM endpoints.\
Updated business customer records are then produced in the file at `data/customers-migrated.json`.

### View Results

You can get a list of user accounts in the authorization server by running this command:

```bash
npm run list
```

Or you can clean all user accounts from the authorization server with this command, and re-run the migration:

```bash
npm run delete
```
