# OAuth Secured Zero Trust API

An OAuth secured API that validates a JWT access token and applies claims-based authorization on every request.\
The example also demonstrates a productive technique for testing API security with mock user-level access tokens.

## API Behavior

The API code aims to reflect a typical business API with moderately complex business authorization.\
The code shows one way to do the OAuth work in a filter and then apply claims-based authorization.\
The code also shows how volatile business permissions can be derived from access token claims.

### Security Library

The API uses the [jose](https://github.com/panva/jose) `JavaScript Object Signing and Encryption` library to handle JWTs.

### Business Logic

The API has some simple classes to deal with an online orders business theme.\
The following main classes are used for the API's simple business logic.\
The authorization logic is driven using claims received in the access token:

| Class | Responsibilities |
| ----- | ---------------- |
| [OAuth Filter](src/security/oauthFilter.ts) | Uses the security library to validate access tokens and enforce the API's required scope |
| [OrdersController](src/logic/ordersController.ts)  | The REST entry point, which runs after the OAuth filter |
| [OrdersService](src/logic/ordersService.ts) | The main service logic applies authorization then triggers data access |
| [OrdersRepository](src/logic/ordersRepository.ts) | Performs data access on some mocked orders data |
| [Authorizer](src/security/codeAuthorizer.ts) | Uses access token claims to make authorization decisions |
| [RolePermissions](src/security/rolePermissions.ts) | Operates on role permissions stored in the business data |

## Operation

The following subsections describe how to configure, run, test and deploy the API.

### Configure the API

The API uses [environment variables](.env) that express its required OAuth settings.\
The API points to its authorization server's JWKS URI to download token signing public keys:

```bash
NODE_ENV='development'
PORT=3000
JWKS_URI='http://localhost:3001/jwks'
REQUIRED_JWT_ALGORITHM='ES256'
REQUIRED_ISSUER='https:/login.example.com'
REQUIRED_AUDIENCE='api.example.com'
REQUIRED_SCOPE='retail/orders'
```

### Start the API

Ensure that you have Node.js 20 or later installed.\
Then build and run the API, which listens on `http://localhost:3000`:

```bash
npm install
npm start
```

### Call the API

Every request to the API requires a user level JWT access token:

```bash
curl -i http://localhost:3000/orders -H 'Authorization: Bearer abc123'
```

The API denies access unless you supply a JWT access token that passes all security checks:

```text
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
WWW-Authenticate: Bearer, error=invalid_token, error_description=issing, invalid or expired access token

{"status":401,"code":"invalid_token","message":"issing, invalid or expired access token"}
```

### Test the API

For productive API development, the [API Integration Tests](test/secureIntegrationTests.ts) use mock access tokens.\
Run tests with this command, while the API is running in another terminal window:

```bash
npm test
```

The tests enables developers to test all security conditions frequently as part of their secure development:

```text
✔ A malformed access token results in a 401 status.
✔ An access token with an invalid issuer results in a 401 status.
✔ An access token with an invalid audience results in a 401 status.
✔ An expired access token results in a 401 status.
✔ An access token with an invalid signature results in a 401 status.
✔ An access token with an invalid scope results in a 403 status.
✔ An access token with missing required claims results in a 403 status.
✔ Customers get a filtered list of orders with only their data.
✔ Customers can access details for one of their own orders.
✔ Customers get a 404 status for non-existent order details.
✔ Customers get a 404 status for order details of other customers.
✔ Administrators get a filtered list of orders for their region.
✔ Administrators can get order details for customers in their region.
✔ Administrators cannot get order details for customers in other regions.
```

### Deploy the API

The following scripts run when the API runs in end-to-end Kubernetes deployments in later chapters.\
The API then uses [environment variables](deployment/deployment-code.yaml) that point to a real authorization server.

```bash
./deployment/build.sh
./deployment/deploy.sh
```
