# Public Key Infrastructure


The SPIFFE runtime environment provides an implementation of [SPIFFE specifications](https://github.com/spiffe/spiffe/tree/main/standards), to provide trust between software components.\
This document provides an overview of how it is used in the example deployment.

## Upstream Root Certificate

SPIRE can be given an upstream root certificate authority and we provide one using cert-manager.\
For demo purposes we use a root certificate with a 10 year lifetime.

## Workload Identities

A custom resource called a [ClusterSPIFFEID](https://github.com/spiffe/spire-controller-manager/blob/main/docs/clusterspiffeid-crd.md) is created in the `helm-values.yaml` file:

```yaml
default-spiffe-id:
  spiffeIDTemplate: "spiffe://{{ .TrustDomain }}/ns/{{ .PodMeta.Namespace }}/sa/{{ .PodSpec.ServiceAccountName }}"
  podSelector:
    matchLabels:
      spire-managed-identity: "true"
```

Workloads must use a label such as `spire-managed-identity` to request a workload identity.\
The [SPIRE Controller Manager](https://github.com/spiffe/spire-controller-manager) then registers an entry with the SPIRE server.

Workloads must then mount the [SPIFFE Workload API](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/#spiffe-workload-api) to get SVIDs.\
The [SPIFFE CSI driver](https://github.com/spiffe/spiffe-csi) makes the SPIFFE Workload API available to application containers:

```yaml
volumeMounts:
  - name: spiffe-workload-api
    mountPath: /spiffe-workload-api
    readOnly: true
volumes:
  - name: spiffe-workload-api
    csi:
      driver: "csi.spiffe.io"
      readOnly: true
```

When pods mount the SPIFFE workload API they interact with the SPIRE agent instance on their Kubernetes node.\
The SPIRE agent attests the workload and interacts with the SPIRE server to return SVIDs to the workload.

## Istio Integration

To integrate with Istio, the SPIRE agent must be updated to use the following fixed socket path.\
Istio uses this fixed value and issues SPIRE identities to sidecars if the socket points to SPIRE:

```text
/var/run/secrets/workload-spiffe-uds/socket
```

## Viewing Identities

Use the following command to see details of the root certificate issued by cert-manager:

```bash
kubectl -n spire-server exec -t spire-server-0 -- ./bin/spire-server bundle show
```

Use an online certificate viewer to view the details:

```text
Common Name : example-root-ca
Organization : example
Valid From : Jul 26,2024
Valid To : Jul 24,2034
Issuer : example
```