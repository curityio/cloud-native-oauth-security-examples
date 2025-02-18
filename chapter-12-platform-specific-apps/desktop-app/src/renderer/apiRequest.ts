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

import {ApplicationError} from '../shared/applicationError';
import {IpcEventNames} from '../shared/ipcEventNames';
import {ApiOptions} from './apiOptions';
import {ipcRequest} from './ipcRequest';
import {Order} from '../shared/order';
import {UserInfo} from '../shared/userInfo';

export async function getOrders(): Promise<Order[]> {
    return await makeApiRequest({name: IpcEventNames.ApiOrders}) as Order[];
}

export async function getUserInfo(): Promise<UserInfo> {
    return await makeApiRequest({name: IpcEventNames.ApiOrders}) as UserInfo;
}

/*
 * The React app uses a generic method to make reliable API calls that handle token refresh and expiry
 */
async function makeApiRequest(options: ApiOptions): Promise<any> {
        
    try {

        // Try the API request with the current access token
        return await callApi(options);

    } catch (e1: any) {

        const error1 = e1 as ApplicationError;
        if (error1?.statusCode !== 401) {
            throw e1;
        }

        try {

            // If there is a 401 then try to refresh the access token
            await refreshAccessToken();

        } catch (e2: any) {

            const error2 = e2 as ApplicationError;
            if (error2?.errorCode !== 'invalid_grant') {
                throw e2;
            }

            // Indicate a login is required if token refresh fails with an invalid_grant error
            throw new ApplicationError('login_required', 'User must re-authenticate');
        }

        // Retry the API request with the refreshed access token
        return await callApi(options);
    }
}

async function callApi(options: ApiOptions): Promise<any> {
    return await ipcRequest(options.name, options.requestData || {});
}

async function refreshAccessToken(): Promise<void> {
    await ipcRequest(IpcEventNames.Refresh);
}
