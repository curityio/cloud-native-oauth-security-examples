# Console App Code Example

A simple console app that runs a code flow to authenticate a user and get an access token with which to call APIs.

![console app](console-app.png)

## Prerequisites

First run [deployment scripts](../README.md) to run backend components in a local Kubernetes cluster.\
Install Node.js 20 or later, then trust the authorization server and API certificates:

```bash
export NODE_EXTRA_CA_CERTS='../../resources/apigateway/external-certs/democluster.ca.pem'
```

Also configure your browser to trust the same root certificate if you want to avoid warnings.\
For example, on macOS use Keychain Access to add it to the system keystore.

## Run the App

Then use the following commands to run the app:

```bash
npm install
npm start
```

Sign in as one of the test user accounts:

- User: `dana`, Password: `Password1` (high privilege user)
- User: `kim`, Password: `Password1` (low privilege user)

## Configuration

The app uses the following configuration settings with OAuth endpoint URLs:

```typescript
export class Configuration {
    public static readonly clientId = 'demo-console-client';
    public static readonly scope = 'openid profile retail/orders';
    public static readonly authorizationServerBaseUrl = 'https://login.democluster.example';
    public static readonly authorizationEndpoint = `${Configuration.authorizationServerBaseUrl}/oauth/v2/oauth-authorize`;
    public static readonly tokenEndpoint = `${Configuration.authorizationServerBaseUrl}/oauth/v2/oauth-token`;
    public static readonly issuer = `${Configuration.authorizationServerBaseUrl}/oauth/v2/oauth-anonymous`;
    public static readonly jwksEndpoint = `${Configuration.authorizationServerBaseUrl}/oauth/v2/oauth-anonymous/jwks`;
    public static readonly idTokenAlgorithm = 'ES256';
    public static readonly apiBaseUrl = 'https://api.democluster.example/orders';
}
```

## Source Code Overview

The following table summarizes the application's main source files:

| Source File | Description |
| ----------- | ----------- |
| [index.ts](src/index.ts) | The entry point to the console application |
| [oauthClient.ts](src/oauth/oauthClient.ts) | An object that makes OAuth requests |
| [loginRequestResponse.ts](src/oauth/loginRequestResponse.ts) | An object that sends the login request and gets back the login response |
| [apiClient.ts](src/apiClient.ts) | An object that makes API requests |
