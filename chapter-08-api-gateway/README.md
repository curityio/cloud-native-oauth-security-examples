# API Gateway Extensibility Example

This example deployment demonstrates the phantom token flow:

- The authorization server is exposed at `http://login.examplecluster.com`
- The authorization server's admin UI is exposed at `http://admin.examplecluster.com`
- A minimal API is exposed at `http://api.examplecluster.com/minimalapi`
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

### 1. Create the Cluster

Create a cluster and run a load balancer to enable the API to be exposed on an external IP address.\
On Windows, use a `Run as administrator` shell in order to run the load balancer:

```bash
export CLUSTER_NAME='gateway-extensibility'
./1-create-cluster.sh
```

### 2. Deploy the API gateway

Then run another shell to create an ingress and use the same cluster name.\
On macOS accept the prompt to allow the load balancer to accept connections.\
Note the external IP address that the script outputs:

```bash
export CLUSTER_NAME='gateway-extensibility'
./2-deploy-api-gateway.sh
```

Update your hosts file with the external IP address, similar to the following:

```text
172.18.0.5 api.examplecluster.com login.examplecluster.com admin.examplecluster.com
```

### 3. Deploy the Authorization Server

Deploy the authorization server with some preconfigured clients and users.\
This requires a license file for the particular authorization server we use:

```bash
export LICENSE_FILE_PATH='license.json'
./3-deploy-authorization-server.sh
```

- Login to the Admin UI at `http://admin.examplecluster.com/admin` with credentials `admin / Password1`
- Locate OpenId Connect metadata at `http://login.examplecluster.com/oauth/v2/oauth-anonymous/.well-known/openid-configuration`


### 4. Deploy the Minimal API

Deploy the minimal API:

```bash
./4-deploy-api.sh
```

- Locate the API endpoint at `http://api.examplecluster.com/minimalapi`

### 5. Run an OAuth Client

Run the script to get an access token using the client credentials flow.\
The client then sends an opaque access token to the API:

```bash
./5-run-oauth-client.sh
```

The script demonstrates that the API receives a JWT access token:

```text
Client authenticated and received an opaque access token
Client succesfully called API: {"message": "API received a JWT access token"}
```

You can also view the logs of the API gateway.\
The output will indicate that the opaque token was successfully introspected.

```bash
KONG_POD=$(kubectl -n kong get pod -o jsonpath="{.items[0].metadata.name}")
kubectl -n kong logs -f $KONG_POD -c proxy
```

### 6. Tear Down the Cluster

Run this command to free resources:

```bash
export CLUSTER_NAME='gateway-extensibility'
kind delete cluster --name=$CLUSTER_NAME
```
