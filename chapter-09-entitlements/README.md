# Entitlements Deployment

This example deployment provides the following external behaviors for users:

- The authorization server is exposed at `https://login.democluster.example`
- The authorization server's admin UI is exposed at `https://admin.democluster.example`
- An API is exposed from a cluster at `https://api.democluster.example/orders`
- A console app is used to perform a login and get a user level access token
- The console app sends the user level access token to an API to access order information

## Deploy the System

Deploy the system on a computer running Linux, macOS or Windows (with Git bash).\
First ensure that you have these tools installed:

- A [Docker Engine](https://docs.docker.com/engine/install), preferably configured to use 16GB of RAM
- [KIND](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [kubectl](https://kubernetes.io/docs/tasks/tools)
- [Helm](https://helm.sh/docs/intro/install)
- [jq](https://jqlang.github.io/jq/download)
- [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/#running-opa)

### Create the Cluster

Create a cluster and run a load balancer to enable the API to be exposed on an external IP address.\
On Windows, use a `Run as administrator` shell in order to run the load balancer:

```bash
./1-create-cluster.sh
```

### Deploy the API gateway

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

### Deploy the Authorization Server

Deploy the authorization server with some preconfigured clients and users.\
This requires a license file for the particular authorization server we use:

```bash
export LICENSE_FILE_PATH='license.json'
./3-deploy-authorization-server.sh
```

- Login to the Admin UI at `https://admin.democluster.example/admin` with credentials `admin / Password1`
- Locate OpenId Connect metadata at `https://login.democluster.example/oauth/v2/oauth-anonymous/.well-known/openid-configuration`

To avoid browser SSL trust warnings you should trust the following development root certificate.\
For example, on macOS use Keychain Access to add it to the system keystore.

```text
../resources/apigateway/external-certs/democluster.ca.pem
```

### Deploy the Policy Retrieval Point

Deploy an HTTP server, the policy retrieval point, that hosts the policy bundle for OPA. The endpoint for the policy-bundle is not exposed from the cluster:

```bash
./4-deploy-policy-retrieval-point.sh
```

The internal URL to the policy retrieval point and policy-bundle is `http://policy-retrieval-point-svc/bundle.tar.gz`. This is the URL where OPA gets the bundle from.

### Deploy the Example API with OPA

Deploy the example API from [chapter 5](/chapter-05-secure-api-development/), running OPA as a sidecar.

```bash
./5-deploy-api-with-opa.sh
```

- Locate the API endpoint at `https://api.democluster.example/orders`

The API queries OPA for the authorization decision. OPA runs as a sidecar on the same pod as the API and points to the policy retrieval point to get its policy. The API can communicate with the OPA over its local interface. See an excerpt from the deployment file (`chapter-05-secure-api-development/deployment/kubernetes/deployment.yaml`).

```yaml
...
    spec:
      serviceAccountName: zerotrustapi
      containers:
      - name: zerotrustapi
        env:
          - name: 'POLICY_ENDPOINT'
            value: 'http://127.0.0.1:8181/v1/data/orders/allow' # Endpoint at OPA for the policy
            ...
        ...
      initContainers:
      - name: policyengine
        image: openpolicyagent/opa:latest
        restartPolicy: Always
        args:
          - "run"
          - "--ignore=.*"
          - "--server"
          - "--addr"
          - "127.0.0.1:8181" # Listen on local interface
          - "--set"
          - "decision_logs.console=true" # Enable decision logging
          - "--set"
          - "bundles.cli1.persist=false" # Do not persist bundle on local file system
          - "http://policy-retrieval-point-svc/bundle.tar.gz" # URL to download policy bundle from

```

## Run an OAuth Client

Run a simple console app client that invokes the system browser:

```bash
./6-run-oauth-client.sh
```

Log in with a username and password using the following test credential:

- bob / Password1

The console app gets an access token and makes two secured API requests.\
The first API request is authorized, whereas the second is for an unauthorized order ID.\
The API rejects the second request because the policy does not allow access, so the client reports an error.

```text
Console client is authenticating a user via the system browser ...
Authentication successful: access token received
Console client is calling API to get a list of authorized orders ...
[
  {
    "id": "20881",
    "customerId": "2099",
    "amountUsd": 900,
    "region": "USA",
    "date": "2024-06-11",
    "status": "completed"
  },
  {
    "id": "20885",
    "customerId": "2099",
    "amountUsd": 3000,
    "region": "USA",
    "date": "2024-06-14",
    "status": "completed"
  }
]
Console client is calling API to get an order by ID ...
Problem encountered: status: 404, code: not_found, message: Resource not found for user
```

Alternatively, you can re-run the client and login with this the following test credential.\
Both API requests are then authorized, and responses include different authorized data.

- kim / Password1

The authorization rules are based on these data relationships:

- [Dana's user account](https://github.com/curityio/cloud-native-oauth-security-examples/tree/main/resources/authorizationserver/data-backup.sql#L339) has `customer_id=2099` and `role=customer`.
- [Kims's user account](https://github.com/curityio/cloud-native-oauth-security-examples/tree/main/resources/authorizationserver/data-backup.sql#L340) has a `role=admin` and `region=USA`.
- The client requests an [order with an ID of 20882](https://github.com/curityio/cloud-native-oauth-security-examples/tree/main/chapter-12-platform-specific-apps/console-app/src/index.ts#L19).
- The [order 20882 resource](https://github.com/curityio/cloud-native-oauth-security-examples/tree/main/chapter-05-secure-api-development/data/orderSummary.json#L11) has `customer_id=3044` and `region=USA`.
- Dana is not authorized to access the order since it is for another customer.
- Kim is authorized to access the order since she has access to all USA orders.
- If you edit the client code to request the [order 20881 resource](https://github.com/curityio/cloud-native-oauth-security-examples/blob/main/chapter-05-secure-api-development/data/orderSummary.json#L3), both Dana and Kim are granted access, since Dana owns this USA order.

## Policy Based Authorization

Instead of hardcoding authorization rules in the API, the API queries OPA for a decision. For that, it makes a POST request to the policy endpoint and adds details to its query:

* the access token so that OPA can retrieve the user claims and perform claims-based authorization
* the type of requested access in form of the requested action and type of resource that the action targets
* optionally, details about the resource, i.e. the customerId or region of an order if applicable

To query the authorization policy, you can remote to the orders container:

```bash
ORDERS_POD=$(kubectl -n applications get pod -o name | grep 'zerotrustapi')
kubectl -n applications exec -it $ORDERS_POD -c zerotrustapi -- bash
```

Then use curl to send a request to the policy engine in the same way as the API code:

```bash
INPUT='{
  "input": {
      "accessToken": "eyJraWQiOiItMzczNDk1MzE2IiwieDV0IjoiXzNHeFpDS0ZzcXQyeEJSZkpxSTJ4TXppWl8wIiwiYWxnIjoiRVMyNTYifQ.eyJqdGkiOiI5ZTcxNDIyNy1mYzc3LTQ2NDctYWY5NC05ZDBkYTYwZjU1MDciLCJkZWxlZ2F0aW9uSWQiOiJlMjE3ZmNjYS1iZDQ2LTQ1ZjgtYjRkZi0yODliZDdiZTE5ZDEiLCJleHAiOjE3MTUxNjM1MTUsIm5iZiI6MTcxNTE2MjYxNSwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSByZXRhaWwvb3JkZXJzIiwiaXNzIjoiaHR0cDovL2xvZ2luLmV4YW1wbGVjbHVzdGVyLmNvbS9vYXV0aC92Mi9vYXV0aC1hbm9ueW1vdXMiLCJzdWIiOiJib2IiLCJhdWQiOlsiZGVtby1jb25zb2xlLWNsaWVudCIsImFwaS5leGFtcGxlLmNvbSJdLCJpYXQiOjE3MTUxNjI2MTUsInB1cnBvc2UiOiJhY2Nlc3NfdG9rZW4iLCJsZXZlbF9vZl9hc3N1cmFuY2UiOjIsInJvbGVzIjpbImN1c3RvbWVyIl0sImN1c3RvbWVyX2lkIjoiMjA5OSIsInJlZ2lvbiI6IlVTQSJ9.pENFaz8TMMWoV9I1c-MtKfuf9lhIi2veSUQSSJcps6GiW7v8hq1IJqFY1kEp-DQDDrD64LL-_3igSA2eJYQEwg",
      "action": "list",
      "type": "order"
  }
}'

curl -X POST http://127.0.0.1:8181/v1/data/orders/allow \
-H 'content-type: application/json' \
-d "$INPUT"
```

The following is a response to the query `is this user allowed to list orders?` where the access token in `accessToken` contains the details about the user, `action` is `list`,  and `type` is `order`. The policy allows the request with a condition. The user is allowed to list orders but only for their own customer ID:

```json
{
  "decision_id": "c1496ca4-a05b-4751-b8d6-ab934a283e99" ,
  "result" : {
     "allowed": true,
     "condition": {
        "customerId" : "2099"
     }
  }
}
```

It is up to the API to enforce this decision. As `allowed` can have conditions, the API also has to check the conditions in the result when enforcing the policy:

```typescript
if (result.allowed && result.condition.customerId) {
    return await this.repository.getOrdersForCustomer(result.condition.customerId);
}
```

### Troubleshooting

To view API logs you can run these commands:

```bash
ORDERS_POD=$(kubectl -n applications get pod -o name | grep 'zerotrustapi')
kubectl -n applications logs -f $ORDERS_POD -c zerotrustapi
```

To view OPA logs you can run the following commands:

```bash 
POLICY_POD=$(kubectl -n applications get pod -o name | grep 'zerotrustapi')
kubectl -n applications logs -f $POLICY_POD -c policyengine
```

### Audit Logs

In this deployment, we enabled OPA decision logs, which serve as audit logs for the API authorization.\
The output is [customized using masking](./policy-retrieval-point/policy/logging.rego) to include some token claims and to avoid logging the JWT access token:

```json
{
  "bundles": {
    "policyRetrievalPoint": {}
  },
  "decision_id": "f5549793-fc36-4b2f-814e-b304b731d5b6",
  "erased": [
    "/input/accessToken"
  ],
  "input": {
    "action": "list",
    "claims": {
      "customer_id": "2099",
      "level_of_assurance": 2,
      "region": "USA",
      "roles": [
        "customer"
      ],
      "scope": "openid profile retail/orders"
    },
    "type": "order"
  },
  "labels": {
    "id": "2b514d01-c1fe-4c38-b8ae-d360aa1d3d69",
    "version": "0.69.0"
  },
  "level": "info",
  "masked": [
    "/input/claims"
  ],
  "metrics": {
    "counter_server_query_cache_hit": 0,
    "timer_rego_external_resolve_ns": 1172,
    "timer_rego_input_parse_ns": 63366,
    "timer_rego_query_compile_ns": 83142,
    "timer_rego_query_eval_ns": 620485,
    "timer_rego_query_parse_ns": 60773,
    "timer_server_handler_ns": 907231
  },
  "msg": "Decision Log",
  "path": "orders/allow",
  "req_id": 62,
  "requested_by": "127.0.0.1:34396",
  "result": {
    "allowed": true,
    "condition": {
      "customerId": "2099"
    }
  },
  "time": "2024-10-15T10:53:10Z",
  "timestamp": "2024-10-15T10:53:10.255805984Z",
  "type": "openpolicyagent.org/decision_logs"
}
```

You could log ship the audit logs to a central log aggregation system.\
You could then run queries to analyze particular types of authorization decisions.

Logging output includes any errors that the policy engine reports.\
During development you can troubleshoot behavior if you write [OPA print statements](https://blog.openpolicyagent.org/introducing-the-opa-print-function-809da6a13aee), to include debug information in logs.

### Tear Down the Cluster

When you have finished testing, you can run this command to free resources:

```bash
./7-delete-cluster.sh
```

### Further Information

See the [Rego Cheat Sheet](https://docs.styra.com/opa/rego-cheat-sheet) for further information on Rego syntax.
