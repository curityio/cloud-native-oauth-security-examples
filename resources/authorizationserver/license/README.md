# License for the Curity Identity Server

Deployments of the Curity Identity Server require a license file which scripts get automatically.

## Option 1: Get a License with a Tool

An API provides license files and requires an access token to authorize the request.\
The first time you run a book example that uses the Curity Identity Server, you receive a prompt:

```text
 This script gets a book license file for the Curity Identity Server.
A CLI will run a code flow in the system browser to get an access token with which to download the license.
Press a key to continue ...
```

The CLI runs a code flow to get an access token.\
During the code flow you can choose from one of the following login options:

- Verify your email address
- Use an anonymous login
- Use an existing account to sign in to the [Curity developer portal](https://developer.curity.io)

When the code flow completes, the CLI saves a `license.json` file to disk.\
The license saves to the `resources/authorizationserver/license` folder of the deployment examples.

## Option 2: Provide Your Own Licnse

If you prefer to use an existing license you can instead provide your own lincese.\
If for some reason you have problems running the CLI, get a [community edition license](https://developer.curity.io/community-edition/) from the Curity website.\
Copy your `license.json` file into the `resources/authorizationserver/license` folder.

## Using Passkeys

Running the passkeys example from chapter 14 requires extra license features beyond the community license.\
To get one, use the license tool or get a trial license from the Curity website instead.
