# Authorization Server Database Setup

The authorization server uses a basic deployment that populates a PostgreSQL database from a SQL backup script.\
This README provides some useful commands so that you can query the authorization server's data.

## Service

You can view the database service here, which is not exposed from the cluster.\
It listens on the default PostgreSQL port of 5432.

```
kubectl -n authorizationserver get svc/postgres-svc
kubectl -n authorizationserver get svc/postgres-svc -o yaml
```

The authorization server connects to the database using JDBC and this connection string:

```text
jdbc:postgresql://postgres-svc/idsvr
```

## Querying the Database

Get the database pod using commands of this form:

```bash
kubectl -n authorizationserver get pod
kubectl -n authorizationserver get pod/postgres-7d9c8767db-tj6sj
```

Get a shell to the PostgreSQL pod using a command of this form:

```bash
kubectl -n authorizationserver exec -it pod/postgres-7d9c8767db-tj6sj -- bash
```

Connect to the database:

```bash
export PGPASSWORD=Password1 && psql -p 5432 -d idsvr -U postgres
```

Get a list of database tables with this PostgreSQL command:

```bash
\dt;
```

Then query a particular table to gain insight into the identity data:

```bash
select * from accounts;
select * from delegations;
select * from tokens;
```

## Database High Availability

A real Kubernetes database deployment would also need to meet high availability requirements such as these:

- If you delete the PostgreSQL pod you avoid data loss.
- If you recreate the cluster you avoid data loss.

Storing database data outside of a Kubernetes cluster is a common way to meet these requirements.\
You then use a persistent volume that points to the external storage location.\
This requires a [Kubernetes Storage Class](https://kubernetes.io/docs/concepts/storage/storage-classes/) that supports external storage.

We avoid this type of deployment since it adds complexity and we want to keep the focus on identity rather than database technology.\
If you are interested in updating our deployments to use external storage, you could do so using the following resources:

- [External Storage Provisioner](https://github.com/kubernetes-sigs/sig-storage-lib-external-provisioner)
- [Kind Persistent Volumes Tutorial](https://mauilion.dev/posts/kind-pvc/)
