# Database Client

The database client uses the postgres-client command line to make mutual TLS connections to a postgres server.\
The client presents its SPIFFE X509 SVID as a database credential.\
This follows the [SPIFFE Helper Postgres Example](https://github.com/spiffe/spiffe-helper/tree/main/examples/postgresql), translated to Kubernetes.

## Database Client SPIRE Identity

The pod is configured with the following labels:

```yaml
spec:
  template:
    metadata:
      labels:
        app: dbclient
        spire-managed-dns-identity: 'true'
        dnsIdentity: dbclient
```

When the pod is deployed, the SPIRE Controller Manager registers the workload.\
This is done using the ClusterSPIFFEID that was created during the SPIRE installation.\
The entry can be viewed with the following command:

```bash
kubectl -n spire-server exec -t spire-server-0 -- ./bin/spire-server entry show
```

It includes a DNS identity which will be the primary identity of the X509 SVID:

```text
Entry ID         : 646a89fe-ded6-4f19-8c9e-24728d403014
SPIFFE ID        : spiffe://democluster.internal/ns/applications/sa/dbclient
Parent ID        : spiffe://democluster.internal/spire/agent/k8s_psat/example/df512d17-04f8-4b96-bd9a-9f712d5ca6b8
Revision         : 0
X509-SVID TTL    : default
JWT-SVID TTL     : default
Selector         : k8s:pod-uid:9a229374-fff8-466a-99b8-2b984cddde53
DNS name         : dbclient
```

## X509 SVID Downloads

The SPIFFE helper utility runs in a sidecar and downloads X509 SVIDs.\
It does so by mounting the SPIFFE workload endpoint using the SPIFFE CSI driver.\
The helper then saves certificates to a shared volume, which the main container can read.

```yaml
spec:
  serviceAccountName: dbclient
  containers:
  - name: dbclient
    image: dbclient:v1
    volumeMounts:
      - name: svids
        mountPath: /svids
  - name: dbclient-spiffehelper
    image: ghcr.io/spiffe/spiffe-helper:0.9.1
    volumeMounts:
      - name: dbclient-spiffehelper-config
        mountPath: /service/helper.conf
        subPath: helper.conf
        readOnly: true
      - name: spiffe-workload-api
        mountPath: /spiffe-workload-api
        readOnly: true
      - name: svids
        mountPath: /svids
  volumes:
    - name: spiffe-workload-api
      csi:
        driver: "csi.spiffe.io"
        readOnly: true
    - name: dbclient-spiffehelper-config
      configMap:
        name: dbclient-spiffehelper-config
    - name: svids
      emptyDir: {}
```

Once the client is deployed, get a remote shell to its container:

```bash
DATABASECLIENT=$(kubectl -n applications get pods --selector='app=dbclient' -o=name)
kubectl -n applications exec -it $DATABASECLIENT -- bash
```

Certificate files are downloaded to the `/svids` folder:

```text
svid.pem
svid_key.pem
svid_bundle.pem
```

Use an online certificate viewer to decode the `svid.pem` details, which contains two certificates.\
The X509 DNS identity for the dbclient is presented to the server, and a user of the same name must exist in Postgres:

```text
Common Name : dbclient
Alternative Names : dbclient, URI:spiffe://democluster.internal/ns/applications/sa/dbclient
Organization : SPIRE
Valid From : July 26, 2024
Valid To : July 26, 2024
Issuer : example-intermediate-ca, example
```

The second certificate is the SPIRE short-lived intermediate certificate authority:

```text
Common Name : example-intermediate-ca
Alternative Names : URI:spiffe://democluster.internal
Organization : example
Valid From : July 26, 2024
Valid To : July 27, 2024
Issuer : example-root-ca, example
```

## Connect to the Database

Run this command to make a mutual TLS database connection to the products database:

```bash
export PGSSLKEY='/svids/svid_key.pem'
export PGSSLCERT='/svids/svid.pem'
export PGSSLROOTCERT='/svids/svid_bundle.pem'
psql postgresql://dbclient@dbserver-svc/products?sslmode=verify-full
```

Then query data:

```sql
select * from products;
```

## JWT SVIDs

This component also configures SPIFFE Helper to download JWT SVIDs.\
You can view them in the `/svids` folder in the following documents:

- `jwt_svid.token`: the workload identity in a JWT SVID
- `jwt_bundle.json`: the public keys for roots of trust in JWK format
