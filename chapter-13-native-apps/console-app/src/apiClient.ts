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

import fetch, {Response} from 'node-fetch'
import {Configuration} from './configuration.js';

/*
 * Call the API to get all orders the user is authorized to access
 */
export async function getOrdersList(accessToken: string): Promise<string> {
    return getDataFromApi(Configuration.apiBaseUrl, accessToken);
}

/*
 * Call the API to get a single order the user is authorized to access
 */
export async function getOrderById(id: string, accessToken: string): Promise<any> {
    return getDataFromApi(`${Configuration.apiBaseUrl}/${id}/details`, accessToken);
}

/*
 * Parameterize calls to the API
 */
async function getDataFromApi(url: string, accessToken: string): Promise<any> {

    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        },
    };

    const response = await fetch(url, options);
    if (response.status !== 200) {
        const details = await getHttpResponseError(response);
        throw new Error(details);
    }

    return response.json()
}

/*
 * Read the API code and message fields from an HTTP response
 */
async function getHttpResponseError(response: Response): Promise<string> {
    
    try {

        const payload = await response.json() as any;
        const code = payload.code || '';
        const message = payload.message || '';
        return `status: ${response.status}, code: ${code}, message: ${message}`;

    } catch (e: any) {

        return '';
    }
}
