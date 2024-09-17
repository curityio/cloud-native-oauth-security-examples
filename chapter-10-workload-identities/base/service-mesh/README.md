# Service Mesh

The service mesh provides productivity features for applications.\
This includes an API gateway and a sidecar that automate the use of Mutual TLS.

## Sidecar Injection

To use Istio and SPIRE together you must customize the `workload-socket` volume to use the SPIFFE workload endpoint.\
To do so, instruct istiod to mount the CSI driver when it injects `istio-proxy` sidecar containers.\
A custom istiod `helm-values.yaml` file manages this:

```yaml
defaults:
  meshConfig:
    trustDomain: democluster.internal

  sidecarInjectorWebhook:
    templates:
      spire: |
        spec:
          volumes:
            - name: workload-socket
              csi:
                driver: "csi.spiffe.io"
                readOnly: true
      spire-gw: |
        spec:
          volumes:
            - name: workload-socket
              emptyDir: null
              csi:
                driver: "csi.spiffe.io"
                readOnly: true
```

## Transparent Mutual TLS for Workloads

To deploy a workload to require the service mesh mTLS you use configuration similar to the following:

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: myapi
spec:
  selector:
    matchLabels:
      role: myapi
  mtls:
    mode: STRICT
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapi
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapi
  template:
    metadata:
      labels:
        app: myapi
        sidecar.istio.io/inject: 'true'
        spire-managed-identity: 'true'
      annotations:
        inject.istio.io/templates: 'sidecar,spire'
    spec:
      serviceAccountName: myapi
      containers:
      - name: myapi
        image: myapi:v1
```

Server pods use the following properties so that sidecars set up HTTPS listeners using the pod's SPIRE X509 identity.\
Client pods use the same properties so that sidecars attach the pod's SPIRE X509 identity to outgoing API requests.

| Property | Meaning |
| -------- | ------- |
| sidecar.istio.io/inject: 'true' | Add an Istio sidecar to the pod |
| spire-managed-identity: 'true' | Ask SPIRE controller manager to register an entry for the pod |
| inject.istio.io/templates: 'sidecar,spire' | Mount the CSI volume using the spire template from the istiod helm-values.yaml |

## Transparent Mutual TLS for the Istio Gateway

The Istio API gateway uses an instance of `istio-proxy` to initiate mTLS connections to upstreams when required.\
Istiod uses [auto-injection](https://istio.io/latest/docs/setup/additional-setup/gateway/) to create gateway pods.\
The `spire-managed-identity` label ensures that the gateway gets its own registered SPIRE entry.\
The gateway's `helm-values.yaml` file references the `spire-gw` template from the istiod `helm-values.yaml` file.

```yaml
defaults:
  labels:
    spire-managed-identity: 'true'
    
  podAnnotations:
    inject.istio.io/templates: 'gateway,spire-gw'
```

Use the following command to get the gateway's SPIRE identity:

```bash
kubectl -n spire-server exec -t spire-server-0 -- ./bin/spire-server entry show
```

You will see that the `spire-managed-identity` custom label has resulted in a registration:

```text
Entry ID         : example.9c6f59fd-f591-40a0-99b9-0024986b149f
SPIFFE ID        : spiffe://democluster.internal/ns/istio-system/sa/istio-ingressgateway
Parent ID        : spiffe://democluster.internal/spire/agent/k8s_psat/example/d52adcfe-f11f-4185-8bc9-e94e534ef10e
Revision         : 0
X509-SVID TTL    : default
JWT-SVID TTL     : default
Selector         : k8s:pod-uid:c9480b53-5219-439d-99b7-741a2e983fae
```
