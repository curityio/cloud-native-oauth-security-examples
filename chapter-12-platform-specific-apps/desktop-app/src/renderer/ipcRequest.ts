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
import {parseMainError} from './errorUtil';

/*
 * Call the main side of the app and handle deserialization of error object responses
 */
export async function ipcRequest(name: string, requestData: any = {}): Promise<any> {

    const result = await (window as any).api.sendMessage(name, requestData);
    if (result.error) {
        throw parseMainError(result.error);
    } else {
        return result.data;
    }
}

/*
 * Make API requests from the React app while also dealing with token refresh and expiry
 */
export async function apiRequest<T>(name: string, requestData: any = {}): Promise<any> {
        
    try {

        // Try the API request with the current access token
        return await ipcRequest(name, requestData) as T;

    } catch (e1: any) {

        const error1 = e1 as ApplicationError;
        if (error1?.statusCode !== 401) {
            throw e1;
        }

        try {

            // If there is a 401 then try to refresh the access token
            await ipcRequest(IpcEventNames.Refresh);
        
        } catch (e2: any) {

            const error2 = e2 as ApplicationError;
            if (error2?.errorCode !== 'invalid_grant') {
                throw e2;
            }

            // Indicate a login is required if refresh fails with an invalid_grant error
            throw new ApplicationError('login_required', 'User must re-authenticate');
        }

        // Retry the API request with the refreshed access token
        return await ipcRequest(name, requestData);
    }
}
