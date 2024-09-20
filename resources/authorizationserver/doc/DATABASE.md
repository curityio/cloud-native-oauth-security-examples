# Authorization Server Database Setup

The authorization server uses a simplified deployment of a PostgreSQL database from a backup script.\
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
