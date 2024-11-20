# Database Server

An example database server that runs postgres and requires mutual TLS for remote connections.\
This follows the [SPIFFE Helper Postgres Example](https://github.com/spiffe/spiffe-helper/tree/main/examples/postgresql), translated to Kubernetes.

## Database Server SPIRE Identity

The pod is configured with the following labels:

```yaml
spec:
  template:
    metadata:
      labels:
        app: dbserver
        spire-managed-dns-identity: 'true'
        dnsIdentity: dbserver-svc
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
SPIFFE ID        : spiffe://democluster.internal/ns/applications/sa/dbserver
Parent ID        : spiffe://democluster.internal/spire/agent/k8s_psat/example/df512d17-04f8-4b96-bd9a-9f712d5ca6b8
Revision         : 0
X509-SVID TTL    : default
JWT-SVID TTL     : default
Selector         : k8s:pod-uid:9a229374-fff8-466a-99b8-2b984cddde53
DNS name         : dbserver-svc
```

## SQL Objects

The docker container runs a SQL script upon creation, which is copied to `/docker-entrypoint-initdb.d`.\
This creates a simple products schema and creates users for processes that use Postgres mutual TLS later.

```sql
CREATE TABLE products (
  id      VARCHAR(40)   PRIMARY KEY,
  name    VARCHAR(128)  NOT NULL
);

INSERT INTO products(id, name) 
VALUES
  ('f2d15608-7d48-11ed-9a61-0242ac1b0002', 'first'),
  ('0636ffae-7d49-11ed-9a61-0242ac1b0002', 'second');

CREATE USER dbclient;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO dbclient;

CREATE USER demoapi;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO demoapi;
```

## X509 SVID Downloads

The SPIFFE helper utility runs in a sidecar and downloads X509 SVIDs.\
The pod mounts the SPIFFE workload endpoint using the SPIFFE CSI driver.\
The helper then saves certificates to file, which Postgres is then configured to load.

```yaml
spec:
  serviceAccountName: dbserver
  containers:
  - name: dbserver
    image: dbserver:v1
    env:
      - name: POSTGRES_USER
        value: postgres
      - name: POSTGRES_PASSWORD
        value: Password1
      - name: POSTGRES_DB
        value: products
    volumeMounts:
      - name: svids
        mountPath: /svids
  - name: dbserver-spiffehelper
    image: ghcr.io/spiffe/spiffe-helper:0.8.0
    volumeMounts:
      - name: dbserver-spiffehelper-config
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
    - name: dbserver-spiffehelper-config
      configMap:
        name: dbserver-spiffehelper-config
    - name: svids
      emptyDir: {}
```

The Postgres docker container copies an `init-dbserver.sh` script to `/docker-entrypoint-initdb.d`.\
This waits for the SPIFFE helper sidecar to make SPIFFE X509 SVIDs available to a shared volume:

```bash
echo 'Waiting for X509 SVIDs ...'
COUNT=0;
while [[ COUNT -lt 20 ]] && [[ ! -f '/svids/svid_key.pem' ]]; do
  echo -n '.'
  sleep 1
  ((COUNT++))
done
```

The Postgres docker container uses a tool called `inotifywait` to detect when new SVIDs have arrived.\
It then runs a `reload_dbconfiguration.sh` script using a local Unix domain socket connection:

```bash
psql -p 5432 -U postgres -c "SELECT pg_reload_conf();"
```

Once the server is deployed, get a remote shell to its container:

```bash
DATABASESERVER=$(kubectl -n applications get pods --selector='app=dbserver' -o=name)
kubectl -n applications exec -it $DATABASESERVER -- bash
```

Locate the certificate files downloaded to the `/svids` folder:

```text
svid.pem
svid_key.pem
svid_bundle.pem
```

Use an online certificate viewer to decode the `svid.pem` details, which contains two certificates.\
The X509 DNS identity for the dbserver is presented to clients:

```text
Common Name : dbserver-svc
Alternative Names : dbserver-svc, URI:spiffe://democluster.internal/ns/applications/sa/dbclient
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
