# Electron Notes

Electron is a popular cross-platform desktop stack where the Chromium browser renders frontend views.\
The desktop app runs with both a frontend `renderer` process and a backend `main` process.\
The code example implements both processes using TypeScript and uses React to render frontend views.

## Code Overview

The main process creates the renderer process with low privileges according to [security recommendations](https://www.electronjs.org/docs/latest/tutorial/security):

```javascript
window = new BrowserWindow({
    ...
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(app.getAppPath(), './preload.js'),
    },
});

window.loadFile('./index.html');
```

OAuth operations like opening the system browser or running an HTTP server require higher privileges.\
The renderer process uses [Inter-Process Communication](https://www.electronjs.org/docs/latest/tutorial/ipc) to ask the main process to initiate high privilege operations.\
The use of IPC adds a little complexity to the desktop application that would not be present in other stacks.

## Builds

Both the main and renderer processes are built to JavaScript EcmaScript bundles in the `dist` folder using the webpack tool.\
The main and renderer processes can use different `tsconfig.json` files to produce JavaScript from TypeScript.\
These assets could be packaged into an installer program to deploy the app.

## Issues

- We use Electron 31 until [this macOS issue](https://github.com/electron/electron/issues/43415) gets fixed.

### Running on Linux
 
In some Linux environments, Electron may output this error when running a development build of the app:

```text
The SUID sandbox helper binary was found ...
```

You may need to run a command such as the following to enable the app to run:

```bash
sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
```
