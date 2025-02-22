# Cluster Connectivity

TODO

We want you to use external connectivity on a development computer in the same way as for real Kubernetes systems.

## Preferred Option

When you run [cloud-provider-kind](https://github.com/kubernetes-sigs/cloud-provider-kind) the Kubernetes API gateway should get an external IP address that you can view with the following command:

```bash
kubectl get svc -n kong
```

You should see the following line of output:

```text
NAMESPACE     NAME                           TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)                         AGE
default       kubernetes                     ClusterIP      10.96.0.1       <none>        443/TCP                         2m19s
kong          kong-kong-proxy                LoadBalancer   10.96.4.208     172.18.0.5    443:32368/TCP                   36s
```

When particular deployments instruct you to update the `/etc/hosts` file you can then add entries like the following.\
You can even run multiple local clusters, each with their own external IP address. 

```text
172.18.0.5 api.democluster.example login.democluster.example admin.democluster.example
```

You then need to trust the API gateway root certificate at the following path.

```text
resources/apigateway/external-certs/democluster.ca.pem
```

You should then be able to connect to deployed components using the hostname expressed in its `HttpRoute` resource.

```bash
curl -i -k https://api.democluster.example
```

In some cases you may also need to allow an operating system prompt.

```text
Do you want the application “cloud-provider-kind” to accept incoming network connections?
```

## Backup Option

However, on some macOS or Windows computers, you may run into infrastructure that prevents cloud-provider-kind from working.\
In such cases you can fall back to [extraPortMapping](https://kind.sigs.k8s.io/docs/user/ingress/#option-2-extraportmapping) by editing the [cluster.yaml file](../base/cluster.yaml) before creating the cluster.\
The following command uses port mapping on the first worker node:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
  kubeadmConfigPatches:
  - |
    kind: JoinConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 443
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

Then uncomment the following settings in the [API Gateway Helm Chart](../apigateway/helm-values-template.yaml) to also force API gateway pods to run on the first worker node.

```yaml
nodeSelector:
  example-worker
```

Stop running cloud-provider-kind and update your `/etc/hosts` file with your loopback IP address.

```text
127.0.0.1 api.democluster.example login.democluster.example admin.democluster.example
```

When you run the following command.

```bash
kubectl get svc -n kong
```

You will then see a pending status for the external IP address of the API gateway.

```text
NAMESPACE     NAME                           TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)                         AGE
default       kubernetes                     ClusterIP      10.96.0.1       <none>        443/TCP                         2m19s
kong          kong-kong-proxy                LoadBalancer   10.96.4.208     <pending>     443:32368/TCP                   36s
```

You still need to trust the API gateway root certificate at the following path.

```text
resources/apigateway/external-certs/democluster.ca.pem
```

You will then be able to connect to deployed components using the hostname expressed in its `HttpRoute` resource.

```bash
curl -i -k https://api.democluster.example
```
