# Service Mesh

The service mesh provides productivity features for applications.\
This includes sidecars that automate the use of Mutual TLS.

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
