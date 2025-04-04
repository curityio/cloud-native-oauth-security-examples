# Workload Identities

A demo-level SPIRE and service mesh deployment to show how to use workload identities.\
We want you to understand how use workload identities both transparently and actively.

## Example Requirements

This example deployment focuses on meeting the following infrastructure requirements:

- Ensure confidentiality of HTTP requests inside the cluster
- Use strong and short lived OAuth client credentials, rather than client secrets  
- Use strong and short lived database credentials, rather than passwords

## Deploy the System

Deploy the system on a computer running Linux, macOS or Windows (with Git bash).\
First ensure that the following components are installed:

- A Docker Engine such as [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Kubernetes in Docker (KIND)](https://kind.sigs.k8s.io/docs/user/quick-start/)
- [Helm](https://helm.sh/docs/intro/install/)
- [openssl](https://www.openssl.org/)
- [envsubst](https://github.com/a8m/envsubst)

### 1. Create the Cluster

Create a cluster and run a load balancer to enable the API to be exposed on an external IP address.\
On Windows, use a `Run as administrator` shell in order to run the load balancer:

```bash
./1-create-cluster.sh
```

### 2. Deploy the Public Key Infrastructure

Then run another shell to run basic installations of cert-manager and SPIRE.\
See the [PKI setup](./base/pki/README.md) documentation for details.

```bash
./2-deploy-pki.sh
```

### 3. Deploy the Service Mesh

Next, deploy the Istio service mesh, to enable transparent mTLS inside the cluster.\
See the [Service mesh setup](./base/service-mesh/README.md) for details on the Istio SPIRE integration.

```bash
./3-deploy-service-mesh.sh
```

### 4. Deploy the API Gateway

Next deploy the Kong API gateway to enable ingress into the cluster:

```bash
./4-deploy-api-gateway.sh
```

The script outputs the external IP address of the API gateway with a line similar to this:

```text
The cluster's external IP address is 172.18.0.5 ...
```

Add these entries to your computer's `/etc/hosts` file for that IP address:

```text
172.18.0.5 api.democluster.example login.democluster.example admin.democluster.example
```

To avoid browser SSL trust warnings you can trust the following development root certificate.\
For example, on macOS use Keychain Access to add it to the system keystore.

```text
../resources/apigateway/external-certs/democluster.ca.pem
```

### 5. Deploy the Authorization Server

Next deploy the Curity Identity Server as the authorization server.\
See the [authorization server setup](./base/authorizationserver/README.md) documentation for details of the configuration.

```bash
./5-deploy-authorization-server.sh
```

If required, the deployment gets a community edition license file for the Curity Identity Server.\
See the [License README](https://github.com/curityio/book-license-cli) for details.

### 6. Run an OAuth Client that uses a JWT as a Client Credential

Next deploy a test workload which will use a Kubernetes service account token as an OAuth client credential.\
See the [oauth client setup](./oauthclient/README.md) documentation for details of how connections work.

```bash
./6-deploy-oauthclient.sh
```

### 7. Run a Database Server that accepts X509 Credentials

First, run this command to deploy a postgres database server configured to use Mutual TLS with SPIRE X509 SVIDs.\
See the [database server setup](./dbserver/README.md) documentation for details of the configuration.

```bash
./7-deploy-dbserver.sh
```

### 8. Run a Database Client that uses an X509 Database Credential

Next, run this command to deploy a postgres database client that will connect to the database server.\
See the [database client setup](./dbclient/README.md) documentation for details of the configuration.

```bash
./8-deploy-dbclient.sh
```

### 9. Run an API that uses an X509 Database Credential

Finally, run this command to deploy a simple REST API that makes a JDBC connection to the database server.\
To build and deploy the API you must have a Java 21 SDK installed.\
See the [API setup](./demoapi/README.md) documentation for details of the configuration.

```bash
./9-deploy-api.sh
```

### Troubleshoot Connectivity if Required

If you run into external connectivity problems, see the [Connectivity README](../resources/loadbalancer/README.md) document.

### Free Resources

Finally, once you have finished testing, free resources by running these commands:

```bash
./delete-cluster.sh
```
