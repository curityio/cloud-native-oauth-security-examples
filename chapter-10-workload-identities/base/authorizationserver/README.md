# Authorization Server

Once deployment is complete and pods have come up, visit the OpenID Connect metadata endpoint:

- https://login.democluster.example/oauth/v2/oauth-anonymous/.well-known/openid-configuration

Also, login to the Admin UI at the following URL, using credentials `admin / Password1`:

- https://admin.democluster.example/admin

## Helm Chart Settings

The Helm chart for the authorization server provides these settings:

```yaml
admin:
  podLabels:
    sidecar.istio.io/inject: 'true'
    spire-managed-identity: 'true'
  podAnnotations:
    inject.istio.io/templates: 'sidecar,spire'
  serviceAccount:
    name: curity-idsvr-admin
 
runtime:
  podLabels:
    sidecar.istio.io/inject: 'true'
    spire-managed-identity: 'true'
  podAnnotations:
    inject.istio.io/templates: 'sidecar,spire'
  serviceAccount:
    name: curity-idsvr-runtime
```

The authorization server runs over plain HTTP within its container.\
The authorization server also requires mutual TLS due to these Istio settings:

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: idsvr-admin-mtls
spec:
  selector:
    matchLabels:
      role: curity-idsvr-admin
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: idsvr-runtime-mtls
spec:
  selector:
    matchLabels:
      role: curity-idsvr-runtime
  mtls:
    mode: STRICT
```

The authorization server runtime and admin nodes are issued SPIRE identities:

```bash
kubectl -n spire-server exec -t spire-server-0 -- ./bin/spire-server entry show
```

```text
Entry ID         : a131fa10-bc7c-4426-97f2-ce2855383e31
SPIFFE ID        : spiffe://democluster.internal/ns/authorizationserver/sa/curity-idsvr-runtime
Parent ID        : spiffe://democluster.internal/spire/agent/k8s_psat/example/a1861345-adc9-4eff-9a6b-aa5ac792fefa
Revision         : 0
X509-SVID TTL    : default
JWT-SVID TTL     : default
Selector         : k8s:pod-uid:1c91f745-bc7b-4b13-b021-1c15d28fabb3


Entry ID         : 4fedb481-9fd8-45e9-8717-ca3cb7150ef2
SPIFFE ID        : spiffe://democluster.internal/ns/authorizationserver/sa/curity-idsvr-admin
Parent ID        : spiffe://democluster.internal/spire/agent/k8s_psat/example/b2eed140-dc4f-477a-9010-80319e21aa06
Revision         : 0
X509-SVID TTL    : default
JWT-SVID TTL     : default
Selector         : k8s:pod-uid:8f62e53a-a27a-4854-afa1-529ebeaaffe6
```
