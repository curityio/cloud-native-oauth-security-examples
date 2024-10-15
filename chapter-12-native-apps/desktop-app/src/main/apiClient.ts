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
import {ApplicationError} from '../shared/applicationError';
import {Order} from '../shared/order';
import {UserInfo} from '../shared/userInfo';
import {Configuration} from './configuration';
import {OAuthClient} from './oauth/oauthClient';

/*
 * Manage API requests from the main process to remote APIs
 */
export class ApiClient {

    private readonly oauthClient: OAuthClient;

    public constructor(oauthClient: OAuthClient) {
        this.oauthClient = oauthClient;
    }

    public async getOrders(): Promise<Order[]> {
        return await this.callApi(Configuration.apiBaseUrl) as Order[];
    }

    public async getUserInfo(): Promise<UserInfo> {
        
        const data = await this.callApi(this.oauthClient.getUserInfoEndpoint());
        return {
            givenName: data.given_name,
            familyName: data.family_name,
        };
    }

    /*
     * Manage the HTTP details of an API request
     */
    private async callApi(url: string): Promise<any> {

        const accessToken = this.oauthClient.getAccessToken()
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
}
