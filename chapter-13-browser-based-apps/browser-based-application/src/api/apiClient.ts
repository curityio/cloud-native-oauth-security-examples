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

import axios, {AxiosRequestConfig, Method} from 'axios';
import {OAuthClient} from '../oauth/oauthClient';
import {ErrorHandler} from '../utilities/errorHandler';
import {Order} from './order';
import {UserInfo} from './userInfo';

/*
 * The entry point for making calls to business APIs after authentication
 */
export class ApiClient {

    private readonly backendForFrontendBaseUrl: string;
    private readonly oauthClient: OAuthClient;

    public constructor(backendForFrontendBaseUrl: string, oauthClient: OAuthClient) {

        this.backendForFrontendBaseUrl = backendForFrontendBaseUrl;
        this.oauthClient = oauthClient;
    }

    /*
     * Call an API with a secure cookie as a credential
     */
    public async getOrders(): Promise<Order[]> {
        return await this.fetch('GET', `${this.backendForFrontendBaseUrl}/orders`);
    }

    /*
     * Call the OAuth user info endpoint with a secure cookie as a credential
     */
    public async getOAuthUserInfo(): Promise<UserInfo> {
        
        const data = await this.fetch('GET', `${this.backendForFrontendBaseUrl}/oauthuserinfo`);
        return {
            givenName: data.given_name,
            familyName: data.family_name,
        };
    }

    /*
     * Call the Business API and handle retries due to expired access tokens
     */
    private async fetch(method: string, url: string): Promise<any> {

        try {

            // Try the API call
            return await this.fetchImpl(method, url);

        } catch (e: any) {

            // Report errors if this is not a 401
            const error = ErrorHandler.handleApiError(e);
            if (!error.isAccessTokenExpiredError()) {
                throw error;
            }

            // Handle 401s by refreshing the access token in the HTTP only cookie
            await this.oauthClient.refresh();
            try {

                // Retry the API call
                return await this.fetchImpl(method, url);

            } catch (e: any) {

                // Report retry errors
                throw ErrorHandler.handleApiError(e);
            }
        }
    }

    /*
     * Make API requests and send the cookie credential in a cross-origin request
     * Also send the required custom header than enforces CORS preflights
     */
    private async fetchImpl(method: string, url: string): Promise<any> {

        const options = {
            url,
            method: method as Method,
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'token-handler-version': '1',
            },
            withCredentials: true,
        } as AxiosRequestConfig;

        const response = await axios.request(options);
        if (response) {
            return response.data;
        }

        return null;
    }
}
