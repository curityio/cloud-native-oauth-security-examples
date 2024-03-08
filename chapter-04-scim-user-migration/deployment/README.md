# Authorization Server Deployment

This example deploys an instance of the free community edition of the Curity Identity Server.\
Also download a `license.json` file from the [Curity Website](https://developer.curity.io/community-edition).

## Deploy the Authorization Server

Run the following commands to deploy a Docker based authorization server:

```bash
cd deployment
docker pull curity.azurecr.io/curity/idsvr
docker compose --project-name scim up
```

## Do the Initial Setup

Login to the admin UI at `https://localhost:6749/admin` with user `admin` and the password from the docker compose file.\
Complete the basic setup wizard and accept all default settings, then upload the `license.json` file when prompted.

![setup wizard](setup-wizard.png)

## Configure SCIM and a SCIM Client

Use the `Changes / Upload` menu to merge the `configuration.xml` file.\
Then use the `Changes / Commit` option, after which the system is fully configured.\
The XML file can be studied to understand the configuration:

- A scope called `accounts` is created
- The SCIM endpoint is configured to require this scope
- An OAuth client is registered that uses this scope and the client credentials flow

![scim-client](scim-client.png)
