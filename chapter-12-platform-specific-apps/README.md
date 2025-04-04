# OAuth for Native Apps Code Examples

These examples illustrate how to integrate OAuth into the different types of native clients.

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

Update your hosts file with the external IP address, similar to the following:

```text
172.18.0.5 api.democluster.example login.democluster.example admin.democluster.example
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

The example API is called by native clients:

```bash
./4-deploy-api.sh
```

### Run Native Applications

Follow the READMEs specific to each client:

- [OAuth-Secured Console App](console-app/README.md)
- [OAuth-Secured Desktop App](desktop-app/README.md)
- [OAuth-Secured Android Mobile App](android-app/README.md)
- [OAuth-Secured iOS Mobile App](ios-app/README.md)

### Troubleshoot Connectivity if Required

If you run into external connectivity problems, see the [Connectivity README](../resources/loadbalancer/README.md) document.

### Tear Down the Cluster

Run this command to free resources:

```bash
./5-delete-cluster.sh
```
