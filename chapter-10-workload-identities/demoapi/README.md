# Demo API

The API can be called from inside and outside the cluster.\
The API also calls its database in a mutual TLS JDBC connection, using its SPIRE identity.

## Run the API

The API uses the minimal Spark Java stack and is built and run locally with these commands:

```bash
./runlocal.sh
```

From a development computer, call it using this URL, which will fail with a database connection error:

```bash
curl -i -k http://localhost:3000/products
```

## SPIFFE Settings

The API uses a sidecar managed by Istio, with a SPIRE identity, to require mutual TLS for inbound connections.\
The API also downloads SPIRE certificates from the workload API, and uses it in outbound JDBC connections.

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: demoapi
  labels:
    app: demoapi
spec:
  replicas: 1
  selector:
    matchLabels:
      app: demoapi
  template:
    metadata:
      labels:
        app: demoapi
        sidecar.istio.io/inject: 'true'
        spire-managed-dns-identity: 'true'
        dnsIdentity: demoapi
      annotations:
        inject.istio.io/templates: 'sidecar,spire'
    spec:
      serviceAccountName: demoapi
      containers:
      - name: demoapi
        image: demoapi:v1
        env:
          - name: API_PORT
            value: '8000'
          - name: API_DB_CONNECTION
            value: 'jdbc:postgresql://dbserver-svc/products?sslmode=verify-full&sslfactory=io.spiffe.provider.SpiffeSslSocketFactory'
          - name: SPIFFE_ENDPOINT_SOCKET
            value: 'unix:///spiffe-workload-api/socket'
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

## Kong, Istio and Internal mTLS

To route incoming API requests from Kong to APIs with mTLS you should be aware of a couple of additional Kong annotations.\
These ensure that Kong calls the API's ClusterIP address with the internal host name, so that mTLS works:

- Configure `ingress.kubernetes.io/service-upstream: 'true'` against the Kubernetes service.
- Configure `konghq.com/preserve-host: 'false'` against the Kubernetes HttpRoute.

## View API Logs

To troubleshoot behavior in the API, view its logs with these commands:

```bash
DEMOAPI=$(kubectl -n applications get pods --selector='app=demoapi' -o=name)
kubectl -n applications logs -f $DEMOAPI
```

## Call the API

To call the demo API externally, run the following command, which returns a list of products.\
The call from the API to the database uses SPIFFE certificates:

```bash
curl -i -k https://api.democluster.example/products
```

To call the API inside the cluster, get a shell to another pod:

```bash
OAUTHCLIENT=$(kubectl -n applications get pods --selector='app=oauthclient' -o=name)
kubectl -n applications exec -it $OAUTHCLIENT -- bash
```

Then call the API with an internal HTTP URL, which the platform upgrades to mutual TLS:

```bash
curl -i -k http://demoapi-svc:8000/products
```
