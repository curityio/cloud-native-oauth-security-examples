# Authorization Server URLs

The authorization server has both external and internal URLs.\
This document provides some useful commands to get you connected.

## Admin UI

Start by logging in to the admin UI at the external admin URL.\
We provide an unsecure password that is easy to remember and type:

| Field | Value |
| ----- | ----- |
| Admin URL | `https://admin.democluster.example/admin` |
| Admin User | admin |
| Admin Password | Password1 |

Navigate to `Token Service / Clients` to see some example OAuth clients.

## OAuth Endpoints

Get information about external endpoints using the OpenID Connect discovery endpoint:

- `https://login.democluster.example/oauth/v2/oauth-anonymous/.well-known/openid-configuration`

## Internal URLs

Components inside the cluster use internal URLs to connect to the authorization server.\
Get the hostnames and ports using this command:

```bash
kubectl -n authorizationserver get svc
```

This results in the following values:

| Namespace | Service Name | Port |
| --------- | ------------ | ---- |
| authorizationserver | curity-idsvr-admin-svc | 6749 |
| authorizationserver | curity-idsvr-runtime-svc | 8443 |

Therefore these are the full internal base URLs:

```bash
http://curity-idsvr-admin-svc.authorizationserver:6749
http://curity-idsvr-runtime-svc.authorizationserver:8443
```

## Make an Internal Connection

To act as an API that calls the authorization server, first locate an API pod:

```bash
kubectl -n applications get pod
```

Next, get a shell to the container:

```bash
kubectl -n applications exec -it minimalapi-6f9fd76b8d-f22rx -- bash
```

Next, use the `curl` tool to connect to the authorization server.\
Our example APIs use an HTTP request of this form to download the JSON Web Key Set (JWKS) from the authorization server:

```bash
curl http://curity-idsvr-runtime-svc.authorizationserver:8443/oauth/v2/oauth-anonymous/jwks
```
