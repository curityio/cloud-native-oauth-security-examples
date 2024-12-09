# Mobile App to Local Kubernetes Cluster Connectivity

In the example deployment you add the following URLs to your computer's hosts file:

```text
login.democluster.example
api.democluster.example
```

An iOS simulator can resolve domains from the hosts file of the local computer.\
You only need to enable SSL trust for the above domains.

## Configure SSL Trust

First locate the root certificate that the simulator needs to trust:

```text
resources/apigateway/external-certs/democluster.ca.pem
```

Use a method to copy the file to the simulator, such as the following.\
Install a profile when the simulator prompts you to do so:

```bash
FILE_PATH="$(pwd)/democluster.ca.pem"
xcrun simctl openurl booted "file://$FILE_PATH"
```

Then navigate here and enable trust for the root certificate:

```text
Settings / General / About / Certificate Trust Settings
```

## Run the App

The app should now securely connect from the simulator to the Kubernetes cluster on the host computer.\
You can then run its OAuth operations and debug the code if required.
