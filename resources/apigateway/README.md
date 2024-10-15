# API Gateway Deployment

The API gateway is deployed using the [Kong Helm Chart](https://github.com/Kong/charts).

## API Gateway Service

Get basic information about Kong services, including its external IP address:

```
kubectl -n kong get svc/kong-kong-proxy
kubectl -n kong get svc/kong-kong-proxy -o yaml
```

## API Gateway Workloads

Similarly, get information about pods using commands of this form:

```
kubectl -n kong get pod
kubectl -n kong get pod/kong-kong-5c9c6bdf5-m548v -o yaml
```

Each pod consists of two containers:

```text
NAME                        READY   STATUS    RESTARTS   AGE
kong-kong-5c9c6bdf5-m548v   2/2     Running   0          20h
```

The main API gateway is the proxy container.\
You can view its logs with the following form of command:

```bash
kubectl -n kong logs -f kong-kong-5c9c6bdf5-m548v -c proxy
```

## Troubleshooting Plugins

Add code like this in a plugin to write its details to logs, then redeploy the gateway:

```lua
ngx.log(ngx.WARN, 'Some text to log ...')
```

You can get a shell to the proxy container like this:

```bash
kubectl -n kong exec -it kong-kong-5c9c6bdf5-m548v -c proxy -- bash
```

The Helm chart deploys plugin files at the following location in the API gateway proxy containers:

```bash
ls -l /opt/kong/plugins/phantom-token
```
