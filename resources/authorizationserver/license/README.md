# License for the Curity Identity Server

Deployments of the Curity Identity Server require a license file which scripts get automatically.

## Option 1: Get a License with a Tool

Deployment scripts prompt you to run a console app (CLI) that downloads the license file.\
The download requires an access token and the CLI runs a code flow to get one.\
During the code flow you can choose from one of the following login options:

- Verify your email address
- Use an anonymous login
- Use an existing account to sign in to the [Curity developer portal](https://developer.curity.io)

When the code flow completes, you will find a `license.json` file in this folder.

## Option 2: Provide Your Own Licnse

If you prefer to use an existing license you can instead copy your own `license.json` file into this folder.\
Or if you have problems running the CLI for some reason, get a [community edition license](https://developer.curity.io/community-edition/) from the Curity website.

## Using Passkeys

Running the passkeys example from chapter 14 requires extra license features beyond the community license.\
To get one, use the license tool or get a trial license from the Curity website instead.
