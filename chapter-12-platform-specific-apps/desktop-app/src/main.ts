/*
 *  Copyright 2024 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/*
 * The main side of the app, with access to high-privilege desktop functionality
 */

import {app, BrowserWindow, session} from 'electron';
import path from 'path';
import {IpcRequestHandler} from './main/ipcRequestHandler';

/*
 * Electron window handling
 * https://www.electronjs.org/docs/latest/tutorial/quick-start
 */

let window: BrowserWindow | null = null;
let ipcRequestHandler: IpcRequestHandler | null = null;

const createWindow = () => {

    window = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(app.getAppPath(), './preload.js'),
        },
    });

    window.loadFile('./index.html');
    ipcRequestHandler = new IpcRequestHandler(window);

    // Set a secure CSP for the renderer process, which also prevents security warnings
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {

        let policy = '';
        policy += "default-src 'none';";
        policy += " script-src 'self';";
        policy += " connect-src 'self'";
        policy += " child-src 'self';";
        policy += " img-src 'self';";
        policy += " style-src 'self' https://cdn.jsdelivr.net;";
        policy += " object-src 'none';";
        policy += " frame-ancestors 'none';";
        policy += " base-uri 'self';";
        policy += " form-action 'self'";
    
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [policy],
            },
        });
    });
}

app.whenReady().then(() => {

    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {

    if (process.platform !== 'darwin') {
        app.quit();
    }
});
