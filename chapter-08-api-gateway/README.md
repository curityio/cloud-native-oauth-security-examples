# API Gateway Extensibility Example

This example deployment demonstrates the phantom token flow:

- The authorization server is exposed at `https://login.democluster.example`
- The authorization server's admin UI is exposed at `https://admin.democluster.example`
- A minimal API is exposed at `https://api.democluster.example/minimalapi`
- A bash script gets an opaque access token and sends it to the API
- The minimal API receives a JWT access token

## Deploy the System

Deploy the system on a computer running Linux, macOS or Windows (with Git bash).\
First ensure that you have these tools installed:

- A [Docker Engine](https://docs.docker.com/engine/install), preferably configured to use 16GB of RAM
- [KIND](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [kubectl](https://kubernetes.io/docs/tasks/tools)
- [Helm](https://helm.sh/docs/intro/install)
- [jq](https://jqlang.github.io/jq/download)
- [openssl](https://www.openssl.org/)

### 1. Create the Cluster

Create a cluster and run a load balancer to enable the API to be exposed on an external IP address.\
On Windows, use a `Run as administrator` shell in order to run the load balancer:

```bash
./1-create-cluster.sh
```

### 2. Deploy the API gateway

Then run another shell to create an ingress and use the same cluster name.\
On macOS accept the prompt to allow the load balancer to accept connections.\
Note the external IP address that the script outputs:

```bash
./2-deploy-api-gateway.sh
```

Update your hosts file with the external IP address, similar to the following:

```text
172.18.0.5 api.democluster.example login.democluster.example admin.democluster.example
```

### 3. Deploy the Authorization Server

Deploy the authorization server with some preconfigured clients and users.\
If required, the deployment gets a community edition license file for the Curity Identity Server.\
See the [License README](https://github.com/curityio/book-license-cli) for details.

```bash
./3-deploy-authorization-server.sh
```

- Sign in to the Admin UI at `https://admin.democluster.example/admin` with credentials `admin / Password1`
- Locate OpenId Connect metadata at `https://login.democluster.example/oauth/v2/oauth-anonymous/.well-known/openid-configuration`

Also ensure that you trust the following development root certificate.\
For example, on macOS use Keychain Access to add it to the system keystore.

```text
../resources/apigateway/external-certs/democluster.ca.pem
```

### 4. Deploy the Minimal API

Deploy the minimal API:

```bash
./4-deploy-api.sh
```

- Locate the API endpoint at `https://api.democluster.example/minimalapi`

### 5. Run an OAuth Client

Run the script to get an access token using the client credentials flow.\
The client then sends an opaque access token to the API:

```bash
./5-run-oauth-client.sh
```

The script demonstrates that the API receives a JWT access token:

```text
Client authenticated and received an opaque access token
Client successfully called API: {"message": "API received a JWT access token"}
```

You can also view the logs of the API gateway.\
The output will indicate that the opaque token was successfully introspected.

```bash
KONG_POD=$(kubectl -n kong get pod -o jsonpath="{.items[0].metadata.name}")
kubectl -n kong logs -f $KONG_POD -c proxy
```

### 6. Troubleshoot Connectivity if Required

If you run into external connectivity problems, see the [Connectivity README](../resources/loadbalancer/README.md) document.

### 7. Tear Down the Cluster

Run this command to free resources:

```bash
./6-delete-cluster.sh
```
