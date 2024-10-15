# A Node.js OAuth Agent

The OAuth Agent acts an API-driven `BFF OAuth Client` for Single Page Applications.

## REST Interface

The OAuth Agent is a REST API with the following endpoints:

| Endpoint | Description |
| -------- | ----------- |
| GET /oauth-agent/session | Get the authenticated status and return ID token claims if logged in. |
| POST /oauth-agent/login/start | Return the authorization request URL and set a temporary cookie. |
| POST /oauth-agent/login/end | Complete a login, issue secure cookies and return ID token claims. |
| POST /oauth-agent/refresh | Refresh an access token and rewrite cookies. |
| POST /oauth-agent/logout | Clear cookies and return an end session request URL. |

## Configuration

The [deployed instance](deployment/deployment.yaml) runs in a local Kubernetes cluster and uses the following configuration settings.\
Note that some endpoints use internal Kubernetes URLs and others return external URLs to the browser-based application:

```yaml
env:
- name: PORT
  value: '8000'
- name: TRUSTED_WEB_ORIGIN
  value: 'https://www.webapp.example:3000'
- name: ISSUER
  value: 'https://login.democluster.example/oauth/v2/oauth-anonymous'
- name: AUTHORIZE_ENDPOINT
  value: 'https://login.democluster.example/oauth/v2/oauth-authorize'
- name: TOKEN_ENDPOINT
  value: 'http://curity-idsvr-runtime-svc.authorizationserver:8443/oauth/v2/oauth-token'
- name: LOGOUT_ENDPOINT
  value: 'https://login.democluster.example/oauth/v2/oauth-session/logout'
- name: JWKS_ENDPOINT
  value: 'http://curity-idsvr-runtime-svc.authorizationserver:8443/oauth/v2/oauth-anonymous/jwks'
- name: ID_TOKEN_ALGORITHM
  value: 'ES256'
- name: CLIENT_ID
  value: 'bff-oauth-client'
- name: CLIENT_SECRET
  value: 'Password1'
- name: REDIRECT_URI
  value: 'https://www.webapp.example:3000/callback'
- name: POST_LOGOUT_REDIRECT_URI
  value: 'https://www.webapp.example:3000/'
- name: SCOPE
  value: 'retail/orders openid profile'
- name: COOKIE_NAME_PREFIX
  value: 'example'
- name: COOKIE_ENCRYPTION_KEY
  value: fa4d9b3126d0cdebea3e27dd6f6009ec315d7b70f5bfe386b7e3bb2cb18b7ae4
- name: API_COOKIE_BASE_PATH
  value: /
```

## Source Code Overview

The following table summarizes the OAuth Agent's main source files:

| Source File | Description |
| ----------- | ----------- |
| [server.ts](src/server.ts) | The entry point to the OAuth Agent |
| [config.ts](src/config.ts) | Loads environment variables into a configuration object |
| [loginHandler.ts](src/lib/loginHandler.ts) | Logic to manage authorization requests and responses |
| [getToken.ts](src/lib/getToken.ts) | Logic to manage requests to the token endpoint |
| [cookieBuilder.ts](src/lib/cookieBuilder.ts) | Logic to issue the various cookies and their properties |
