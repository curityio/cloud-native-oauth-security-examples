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

import {BrowserWindow, ipcMain, IpcMainInvokeEvent} from 'electron';
import {ApplicationError} from '../shared/applicationError';
import {IpcEventNames} from '../shared/ipcEventNames';
import {ApiClient} from './apiClient';
import {serializeError} from './errorSerializer';
import {OAuthClient} from './oauth/oauthClient';

/*
 * The renderer process run with low privilege and calls the main process to perform OAuth-related work
 */
export class IpcRequestHandler {

    private window: BrowserWindow;
    private readonly oauthClient: OAuthClient;
    private readonly apiClient: ApiClient;

    /*
     * Register for IPC events from the renderer side of the app
     */
    public constructor(window: BrowserWindow) {
        
        this.window = window;
        this.oauthClient = new OAuthClient();
        this.apiClient = new ApiClient(this.oauthClient);

        // Make the this parameter available in async callbacks
        this.initialize = this.initialize.bind(this);
        this.login = this.login.bind(this);
        this.reactivate = this.reactivate.bind(this);
        this.logout = this.logout.bind(this);
        this.getApiOrders = this.getApiOrders.bind(this);
        this.getUserInfo = this.getUserInfo.bind(this);
        this.refreshAccessToken = this.refreshAccessToken.bind(this);

        // Then register event handlers
        ipcMain.handle(IpcEventNames.Initialize, this.initialize);
        ipcMain.handle(IpcEventNames.Login, this.login);
        ipcMain.handle(IpcEventNames.Reactivate, this.reactivate);
        ipcMain.handle(IpcEventNames.Logout, this.logout);
        ipcMain.handle(IpcEventNames.ApiOrders, this.getApiOrders);
        ipcMain.handle(IpcEventNames.UserInfo, this.getUserInfo);
        ipcMain.handle(IpcEventNames.Refresh, this.refreshAccessToken);
    }

    /*
    * Download OpenID Connect metadata when the app starts
    */
    private async initialize(event: IpcMainInvokeEvent): Promise<any> {
        return await this.handleOperation(event, () => this.oauthClient.initialize());
    }

    /*
    * Run a login by opening the system browser and then return ID token claims to the renderer process
    */
    private async login(event: IpcMainInvokeEvent): Promise<any> {
        return await this.handleOperation(event, () => this.oauthClient.login());
    }

    /*
    * Reactivate the window after receiving a login response
    */
    private async reactivate(): Promise<any> {

        this.window!.show();
        return {
            data: null,
            error: '',
        };
    }

    /*
    * Run a logout by dicarding tokens
    */
    private async logout(event: IpcMainInvokeEvent): Promise<any> {
        return await this.handleOperation(event, () => this.oauthClient.logout());
    }

    /*
    * Call the API and return data to the renderer process
    */
    private async getApiOrders(event: IpcMainInvokeEvent): Promise<any> {
        return await this.handleOperation(event, () => this.apiClient.getOrders());
    }

    /*
    * Call the user info endpoint and return data to the renderer process
    */
    private async getUserInfo(event: IpcMainInvokeEvent): Promise<any> {
        return await this.handleOperation(event, () => this.apiClient.getUserInfo());
    }

    /*
    * Refresh the access token
    */
    private async refreshAccessToken(event: IpcMainInvokeEvent): Promise<any> {
        return await this.handleOperation(event, () => this.oauthClient.refreshAccessToken());
    }

    /*
     * Common logic to check the source, log errors and return errors as serialized objects
     */
    private async handleOperation(event: IpcMainInvokeEvent, action: () => Promise<any>): Promise<any> {

        try {

            if (!event.senderFrame?.url.startsWith('file:/')) {
                throw new ApplicationError('ipc_forbidden', 'The IPC request is unauthorized');
            }

            const data = await action();
            return {
                data,
                error: ''
            };

        } catch (e: any) {

            this.logError(e);
            return {
                data: null,
                error: serializeError(e),
            }
        }
    }

    /*
     * Development logging of errors
     */
    private logError(error: any) {

        let text = 'Main error response';

        const applicationError = error as ApplicationError;
        if (applicationError) {
            text += `: ${applicationError.toDisplayFormat()}`;
        } else if (error.message) {
            text += `: ${error.message}`;
        }

        console.log(text);
    }
}
