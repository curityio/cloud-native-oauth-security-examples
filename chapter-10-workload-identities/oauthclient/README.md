# Test OAuth Client

The test OAuth client is a basic pod that uses the client credentials flow.\
The same pattern works for clients that use other flows, like backend clients that use the code flow.\
The OAuth client uses its service account token as a strong and automatically renewed OAuth client credential.

## Kubernetes Settings

The client uses a sidecar that is instructed to use an Istio sidecar with a SPIRE identity.\
This enables it to call the authorization server using mutual TLS.\
It also loads a service account token to present to the OAuth token endpoint:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: oauthclient
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oauthclient
spec:
  replicas: 1
  selector:
    matchLabels:
      app: oauthclient
  template:
    metadata:
      labels:
        app: oauthclient
        sidecar.istio.io/inject: 'true'
        spire-managed-identity: 'true'
      annotations:
        inject.istio.io/templates: 'sidecar,spire'
    spec:
      serviceAccountName: oauthclient
      containers:
      - name: oauthclient
        image: oauthclient:v1
        volumeMounts:
        - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
          name: client-assertion-location
      volumes:
      - name: client-assertion-location
        projected:
          sources:
          - serviceAccountToken:
              path: token
              expirationSeconds: 3600
              audience: 'https://login.democluster.example/oauth/v2/oauth-token'
```

## Get a Shell

Once the client is deployed, get a remote shell to its container:

```bash
OAUTHCLIENT=$(kubectl -n applications get pods --selector='app=oauthclient' -o=name)
kubectl -n applications exec -it $OAUTHCLIENT -- bash
```

## View the Service Account Token

From the container, run the following command to see its service account token:

```bash
cat /var/run/secrets/kubernetes.io/serviceaccount/token
```

In a JWT viewer, the payload looks similar to the following example:

```json
{
  "aud": [
    "https://login.democluster.example"
  ],
  "exp": 1724344795,
  "iat": 1724337595,
  "iss": "https://kubernetes.default.svc.cluster.local",
  "jti": "c39a0c1f-e5c9-4617-bc1e-055605c7b491",
  "kubernetes.io": {
    "namespace": "applications",
    "node": {
      "name": "example-worker",
      "uid": "8c948d13-bd4b-4f47-aa67-0c369b885ff1"
    },
    "pod": {
      "name": "oauthclient-5f9d7465d8-g4j88",
      "uid": "5729ec3d-7e40-430f-b043-1e76534f0f29"
    },
    "serviceaccount": {
      "name": "oauthclient",
      "uid": "78e4dd18-ce09-4095-abbd-13c0f8513fe2"
    }
  },
  "nbf": 1724337595,
  "sub": "system:serviceaccount:applications:oauthclient"
}
```

## Act as an OAuth Client

Then run a client credentials request over plain HTTP, supplying the above JWT as a client assertion.\
The client's sidecar calls to the authorization server's sidecar using mutual TLS:

```bash
SERVICE_ACCOUNT_TOKEN="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)"
curl -s -X POST http://curity-idsvr-runtime-svc.authorizationserver:8443/oauth/v2/oauth-token \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -d 'grant_type=client_credentials' \
     -d 'client_id=oauthclient' \
     -d "client_assertion=$SERVICE_ACCOUNT_TOKEN" \
     -d 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \
     -d 'scope=products' | jq
```

The token response returns an access token which the authorization server can issue in either opaque or JWT format:

```json
{
  "access_token": "_0XBPWQQ_48c7a1f1-f0ab-4f90-a53d-485a398af901",
  "scope": "products",
  "token_type": "bearer",
  "expires_in": 900
}
```

## Using JWT SVIDs

The same pattern can be implemented by [SPIRE-issued JWT SVIDs](https://github.com/spiffe/spiffe/blob/main/standards/JWT-SVID.md) if you prefer.\
The SPIFFE helper can be configured with properties like these:

```text
jwt_svids = [{jwt_audience="https://login.democluster.example/oauth/v2/oauth-anonymous", jwt_svid_file_name="jwt_svid.token"}]
jwt_bundle_file_name  = "jwt_bundle.json"
```

A workload then receives JWT SVID documents with payloads of this form:

```json
{
  "aud": [
    "https://login.democluster.example"
  ],
  "exp": 1722005575,
  "iat": 1722001975,
  "iss": "https://oidc-discovery.democluster.internal",
  "sub": "spiffe://democluster.internal/ns/applications/sa/oauthclient"
}
```

The authorization server can use the internal SPIRE JWKS URI to validate JWT SVIDs:

```bash
curl -i -k https://spire-spiffe-oidc-discovery-provider.spire-server/keys
```

The [dbclient workload](../dbclient/README.md) is configured to download JWT SVIDs.\
Therefore you can use it to view some downloaded JWT SVID documents.
