# Troubleshoot External Connectivity

We want you to connect from a local computer to the API gateway with Kubernetes behaviors that match deployed environments.

## Cloud Provider KIND

When you run [cloud-provider-kind](https://github.com/kubernetes-sigs/cloud-provider-kind) it creates a Docker load balancer for each Kubernetes service of type `LoadBalancer`.\
The load balancer runs outside of the Kubernetes cluster.

```text
CONTAINER ID   IMAGE                      PORTS                     NAMES
bcc56c332115   envoyproxy/envoy:v1.30.1   0.0.0.0:63574->443/tcp    kindccm-544599e9a77f
```

The loadbalancer runs on the KIND Docker bridge network and gets assigned an IP address such as 172.18.0.5.\
You can view lower level Docker networking details with commands of the following form.

```bash
docker inspect network kind
docker inspect bcc56c332115
```

Next, cloud-provider-kind gets the loadbalancer container's external IP address and patches the Kubernetes service.\
You can see the result if you run the following command.

```bash
kubectl get svc -n kong
```

You should see output similar to the following:

```text
NAMESPACE     NAME                           TYPE           CLUSTER-IP      EXTERNAL-IP   PORT
kong          kong-kong-proxy                LoadBalancer   10.96.4.208     172.18.0.5    443:32368/TCP
```

The cloud-provider-kind also adds the IP address to [the host computer's loopback interface](https://github.com/kubernetes-sigs/cloud-provider-kind/blob/main/pkg/loadbalancer/address_darwin.go) to enable connectivity.\
You can run commands like these to connect, where the second command requires an entry in the host computer's `/etc/hosts` file.

```bash
curl -i -k https://172.18.0.5 -H "Host: api.democluster.example"
curl -i -k https://api.democluster.example
```

## macOS and Windows

On these platforms, Docker runs within a virtual machine that does not expose any ports to the host computer.\
Therefore, cloud-provider-kind uses Docker port mapping to add a tunnel that establishes a connection:

- The loadbalancer exposes an ephemeral port such as `63574` to the host computer.
- When you call `172.18.0.5:443` from outside the cluster, a TCP tunnel first routes to `127.0.1:63574`.
- From there the request routes to `172.18.0.5:443` within the kind network and reaches the Kubernetes service.
 
This should work on most computers, but support remains a little experimental.\
On some macOS and Windows computers, the tunnel could fail to work for various infrastructure reasons.\
You can then only connect to a Kubernetes service using the ephemeral port, which is not our intent.

```bash
curl -i -k https://127.0.0.1:63574 -H "Host: api.democluster.example"
```

If you try to use port 443 you may get an error where the client tries to initiate an HTTPS connection but the network connection fails.

```text
curl: (35) LibreSSL SSL_connect: SSL_ERROR_SYSCALL in connection to 172.18.0.2:443 
```

## Extra Port Mapping

If you cannot get cloud-provider-kind to work you can use [extraPortMapping](https://kind.sigs.k8s.io/docs/user/ingress/#option-2-extraportmapping) to enable a working connection.\
First, update the [cluster.yaml file](../base/cluster.yaml) so that the first worker node receives all HTTPS requests from the host computer.

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

You must also update the [API Gateway Helm values file](../apigateway/helm-values-template.yaml) so that all API gateway pods run on the first worker node.

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

The following command will then show different output.

```bash
kubectl get svc -n kong
```

The API gateway now uses a service of type `NodePort` and no longer gets an external IP address:

```text
NAMESPACE     NAME                           TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)
kong          kong-kong-proxy                NodePort       10.96.4.208     <none>        443:32368/TCP
```

You can then initiate requests to external endpoints on port 443:

```bash
curl -i -k https://127.0.0.1 -H "Host: api.democluster.example"
curl -i -k https://api.democluster.example
```

Whenever our deployments instruct you to update your `/etc/hosts` file you must use the IP address `127.0.0.1`.

```text
127.0.0.1 api.democluster.example login.democluster.example admin.democluster.example
```

You can run the following command on the first Kubernetes worker node.\
The output shows that an internal port of 30000 is exposed to the host computer as port 443.

```bash
docker inspect example-worker
```
