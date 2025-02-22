# Troubleshoot External Connectivity

On a development computer, we aim to connect to the API gateway in the most standard way, to match real Kubernetes environments.

## Preferred Option

When you run [cloud-provider-kind](https://github.com/kubernetes-sigs/cloud-provider-kind) the Kubernetes API gateway should get an external IP address that you can view with the following command:

```bash
kubectl get svc -n kong
```

You should see the following line of output:

```text
NAMESPACE     NAME                           TYPE           CLUSTER-IP      EXTERNAL-IP   PORT
kong          kong-kong-proxy                LoadBalancer   10.96.4.208     172.18.0.5    443:32368/TCP
```

When particular deployments instruct you to update the `/etc/hosts` file you can then add entries like the following.\
You can even run multiple local clusters, each with their own external IP address. 

```text
172.18.0.5 api.democluster.example login.democluster.example admin.democluster.example
```

You should then be able to establish connectivity to deployed components using the hostname expressed in its `HttpRoute` resource.

```bash
curl -i -k https://api.democluster.example
```

## Backup Option

However, on some macOS or Windows computers, infrastructure like firewalls may prevent cloud-provider-kind from working.\
In such cases you use developer specific workarounds with [extraPortMapping](https://kind.sigs.k8s.io/docs/user/ingress/#option-2-extraportmapping) and you no longer need to run cloud-provider-kind.

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
    containerPath: /etc/systemd/containerd.service
```

Next, update the [API Gateway Helm Chart](../apigateway/helm-values-template.yaml) to the following content before deploying the gateway.\
All API gateway pods then get scheduled to run on the first Kubernetes worker node, which receives all external HTTPS traffic.

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

You will then be able to establish a connection to deployed components using the hostname expressed in its `HttpRoute` resource.

```bash
curl -i -k https://api.democluster.example
```
