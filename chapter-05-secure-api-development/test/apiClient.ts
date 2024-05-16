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

export class ApiClient {

    private readonly baseUrl: string;
    
    public constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public async getOrders(accessToken: string): Promise<[number, any]> {
        return await this.callApi('GET', '/orders', accessToken);
    }

    public async getOrderDetails(id: string, accessToken: string): Promise<[number, any]> {
        return await this.callApi('GET', `/orders/${id}/details`, accessToken);
    }

    private async callApi(method: string, path: string, accessToken: string): Promise<[number, any]> {

        const options = {
            url: `${this.baseUrl}${path}`,
            method: 'GET',
            headers: {
                authorization: `Bearer ${accessToken}`
            }
        } as AxiosRequestConfig;

        try {
        
            const axiosResponse = await axios(options);
            return [axiosResponse.status, axiosResponse.data];

        } catch (e: any) {

            if (e.response && e.response.status && e.response.data && typeof e.response.data === 'object') {
                return [e.response.status, e.response.data];
            }

            throw e;
        }
    }
}
