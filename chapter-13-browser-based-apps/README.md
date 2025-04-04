# OAuth for Browser-Based Applications Example

This example illustrates how to integrate a Backend for Frontend into an OAuth-secured browser-based application.\
The browser-based application calls a secured API using secure cookie credentials, with no tokens in the browser.

## Deploy the System

Deploy the system on a computer running Linux, macOS or Windows (with Git bash).\
First ensure that you have these tools installed:

- A [Docker Engine](https://docs.docker.com/engine/install), preferably configured to use 16GB of RAM
- [KIND](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [kubectl](https://kubernetes.io/docs/tasks/tools)
- [Helm](https://helm.sh/docs/intro/install)
- OpenSSL 3 to create cookie encryption keys
- The envsubst tool, to update configuration dynamically

### Create the Cluster

Create a cluster and run a load balancer to enable the API to be exposed on an external IP address.\
On Windows, use a `Run as administrator` shell in order to run the load balancer:

```bash
./1-create-cluster.sh
```

### Deploy the API gateway

Then run another shell to deploy an ingress controller to act as an API gateway.\
On macOS accept the prompt to allow the load balancer to accept connections.\
Note the external IP address that the script outputs:

```bash
./2-deploy-api-gateway.sh
```

Update your hosts file with the external IP address, similar to the following.\
The browser-based application runs on the `www.webapp.example` domain and calls its BFF at `api.webapp.example`.\
This ensures that cookies used are in the same parent site and not subject to browser restrictions.

```text
127.0.0.1 localhost www.webapp.example
172.18.0.5 api.democluster.example login.democluster.example admin.democluster.example api.webapp.example
```

To avoid browser warnings, configure trust for the root certificate at the following location.\
For example, on macOS use Keychain Access to add it to the system keystore:

```bash
../resources/apigateway/external-certs/democluster.ca.pem
```

### Deploy the Authorization Server

Deploy the authorization server with some preconfigured clients and users.\
If required, the deployment gets a community edition license file for the Curity Identity Server.\
See the [License README](https://github.com/curityio/book-license-cli) for details.

```bash
./3-deploy-authorization-server.sh
```

- Login to the Admin UI at `https://admin.democluster.example/admin` with credentials `admin / Password1`
- Locate OpenId Connect metadata at `https://login.democluster.example/oauth/v2/oauth-anonymous/.well-known/openid-configuration`

### Deploy the Example API

The example API is called by the SPA using secure cookies:

```bash
./4-deploy-api.sh
```

### Deploy the Backend for Frontend

The backend for frontend consists of a BFF OAuth Client (the OAuth Agent) and an API gateway plugin (the OAuth Proxy).\
The following script deploys the OAuth Agent and configures the OAuth Proxy to run on an API gateway route called by the SPA:

```bash
./5-deploy-bff.sh
```

### Run the Browser-based Application

Then run the [Browser-based Application](browser-based-application/README.md) which uses the React framework.\
If you run into external connectivity problems, see the [Connectivity README](../resources/loadbalancer/README.md) document.

## Backend for Frontend Components

You can read more about other components and study their code:

- The [OAuth Agent](backend-for-frontend/oauth-agent/README.md) is a stateless utility BFF that does OAuth work and cookie issuing on behalf of the SPA
- The [OAuth Proxy](../resources/apigateway/curity-oauth-proxy/README.md) is an API gateway plugin that decrypts cookies and forwards access tokens to APIs
- The [Example API from Chapter 5](../chapter-05-secure-api-development/README.md) is used as a target API called by the SPA

### Tear Down the Cluster

Run this command to free resources:

```bash
./6-delete-cluster.sh
```
