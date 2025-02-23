# Troubleshoot External Connectivity

On a development computer, we aim to connect to the API gateway in the most standard way, to match real Kubernetes environments.

## Cloud Provider KIND

When you run [cloud-provider-kind](https://github.com/kubernetes-sigs/cloud-provider-kind) it adds an external IP address to the [host computer loopback network interface](https://github.com/kubernetes-sigs/cloud-provider-kind/blob/main/pkg/loadbalancer/address_darwin.go).\
The Kubernetes API gateway uses it as an external IP address that you can view with the following command:

```bash
kubectl get svc -n kong
```

You should output similar to the following:

```text
NAMESPACE     NAME                           TYPE           CLUSTER-IP      EXTERNAL-IP   PORT
kong          kong-kong-proxy                LoadBalancer   10.96.4.208     172.18.0.5    443:32368/TCP
```

When our example deployments instruct you to update the `/etc/hosts` file use the external IP address.\
You can even run multiple local clusters, each with their own external IP address. 

```text
172.18.0.5 api.democluster.example login.democluster.example admin.democluster.example
```

You should then be able to connect to deployed components using the hostname expressed in the `HttpRoute` resource.

```bash
curl -i -k https://api.democluster.example
```

In some cases you may also need to approve a firewall prompt from the operating system.

```text
Do you want the application “cloud-provider-kind” to accept incoming network connections?
```

## Troubleshooting Failed Connections

The cloud-provider-kind spins up a local Docker load balancer for each Kubernetes service of type `LoadBalancer`.

```text
CONTAINER ID   IMAGE                      PORTS                     NAMES
bcc56c332115   envoyproxy/envoy:v1.30.1   0.0.0.0:63574->443/tcp    kindccm-544599e9a77f
```

On macOS and Windows, cloud-provider-kind also creates an HTTP tunnel using an ephmeral port like 63574.\
The tunnel routes requests from the local loopback network interface to the KIND docker bridge network.

```bash
docker network inspect kind
```

You should be able to call through the load balancer using port 443 or the ephemeral port that the tunnel uses:

```bash
curl -i -k https://api.democluster.example
curl -i -k https://api.democluster.example:63574
```

On macOS or Windows, cloud-provider-kind is experimental and might fail on some computers when you use port 443.\
You may get an error like this, where the client tries to initiate an HTTPS connection but the network connection fails.

```text
curl: (35) LibreSSL SSL_connect: SSL_ERROR_SYSCALL in connection to 172.18.0.2:443 
```

## Extra Port Mapping

If you cannot get cloud-provider-kind to work you can use [extraPortMapping](https://kind.sigs.k8s.io/docs/user/ingress/#option-2-extraportmapping) instead.\
First, update the [cluster.yaml file](../base/cluster.yaml) to the following content before creating the cluster.\
The first Kubernetes worker node then receives all HTTPS requests from outside the cluster.

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
  extraPortMappings:
  - containerPort: 30000
    hostPort: 443
    protocol: TCP
  extraMounts:
  - hostPath: containerd.service
    containerPath: /etc/systemd/system/containerd.service
- role: worker
  extraMounts:
  - hostPath: containerd.service
    containerPath: /etc/systemd/system/containerd.service
```

Next, update the [API Gateway Helm values file](../apigateway/helm-values-template.yaml) to the following content before deploying the gateway.\
The scheduler then runs all API gateway pods on the first Kubernetes worker node, which receives all external HTTPS traffic.

```yaml
image:
  repository: custom-kong
  tag: 1.0.0

replicaCount: 2
proxy:
  type: NodePort
  http:
    enabled: false
  tls:
    nodePort: 30000
nodeSelector:
  kubernetes.io/hostname: 'example-worker'

$SERVICE_MESH_SETTINGS

plugins:
  configMaps:
  - pluginName: oauth-proxy
    name: curity-oauth-proxy
  - pluginName: phantom-token
    name: curity-phantom-token

env:
  nginx_http_lua_shared_dict: 'phantom-token 10m'
```

You can then use your loopback IP address whenever our deployments instruct you to update your `/etc/hosts` file.

```text
127.0.0.1 api.democluster.example login.democluster.example admin.democluster.example
```

The following command will then show different output.

```bash
kubectl get svc -n kong
```

The API gateway now uses a service of type `NodePort` and no longer gets an external IP address:

```text
NAMESPACE     NAME                           TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)
kong          kong-kong-proxy                NodePort       10.96.4.208     <none>        443:32368/TCP
```

You will then be able to establish a working connection to deployed components.

```bash
curl -i -k https://api.democluster.example
```
