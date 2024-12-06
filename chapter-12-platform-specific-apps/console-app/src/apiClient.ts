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

import axios, {AxiosRequestConfig} from 'axios';
import {ApplicationError} from './applicationError.js';
import {Configuration} from './configuration.js';

/*
 * Call the API to get all orders the user is authorized to access
 */
export async function getOrdersList(accessToken: string): Promise<any> {
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
        url,
        method: 'GET',
        headers: {
            authorization: `Bearer ${accessToken}`,
            accept: 'application/json',
        }
    } as AxiosRequestConfig;

    try {
    
        const response = await axios(options);
        return response.data;

    } catch (e: any) {

        let code = 'api_error';
        let message = 'API request error';
        let status: number | null = null;
        if (e.response) {

            if (e.response.status) {
                status = e.response.status;
            }

            if (e.response.data) {
            
                if (e.response.data.code) {
                    code = e.response.data.code;
                }

                if (e.response.data.message) {
                    message += `: ${e.response.data.message}`;
                }
            }
        } else if (e.message) {
            message += `: ${e.message}`;
        }
        
        throw new ApplicationError(code, message, status);
    }
}
