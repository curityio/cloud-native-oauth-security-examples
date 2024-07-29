# Authorization Server Token Issuance

These notes explain how custom claims are issued to access tokens in the Curity Identity Server.

## User Attributes

When the authorization server is deployed a [SQL backup script](../data-backup.sql) is applied.\
This contains the authorization server schema and, at the end of the script, some test user accounts.\
The user accounts contain user attributes that would typically be populated by a user migration process.\
The user attributes include custom values:

- customer_id
- region
- roles

## Scope Definition

In the admin UI, navigate to `Token Service / Scopes`.\
Locate the scope called `retail/orders` and view the claims it contains:

- customer_id
- region
- roles
- level_of_assurance

## Client

In the admin UI, navigate to `Token Service / Clients` and locate the `demo-console-client`.\
The book's main OAuth clients, including the console app, are authorized to use the `retail/orders` scope.\
The client runs a code flow and requests the `retail/orders` scope.\
The scope's claims are then issued to the access token.

## Claims Population

In the admin UI, navigate to `Token Service / Claims` and view the properties of each claim.\
Each claim uses a claims value provider to retrieve runtime claim values from different sources:

| Claims Value Provider Type | Behavior |
| -------------------------- | -------- |
| Account manager (with OpenID Connect mapping) | Issues built-in OpenID Connect claims |
| Account manager (without OpenID Connect mapping) | Issues built-in claims from the SCIM core schema that are stored against user accounts |
| Data source | Issues custom claims (not in the SCIM core schema) that are stored against user accounts |
| Authentication context | Issues custom claims based on how authentication occurred |

The `level_of_assurance` claim represents the authentication strength, which an API cannot work out by itself.\
For demo purposes this value is set based on the ID of a particular authenticator.
