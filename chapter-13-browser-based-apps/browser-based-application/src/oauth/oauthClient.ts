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
import {ErrorHandler} from '../utilities/errorHandler';
import {PageLoadResponse} from '../utilities/pageLoadResponse';

/*
 * The entry point for making OAuth calls
 */
export class OAuthClient {

    private readonly backendForFrontendBaseUrl: string;

    constructor(backendForFrontendBaseUrl: string) {
        this.backendForFrontendBaseUrl = backendForFrontendBaseUrl;
    }

    /*
     * Page load logic for the SPA, to handle login responses and handle authenticated state
     */
    public async handlePageLoad(location: Location): Promise<PageLoadResponse> {

        if (location.pathname.toLowerCase() === '/callback') {
            
            // The SPA must call the OAuth Agent when its current location is the callback path
            const data = await this.endLogin(location.href);
            data.isLoginHandled = true;
            return data;

        } else {
            
            // Otherwise, the example SPA can ask the OAuth Agent for its authentication status and claims
            const data = await this.getSession();
            data.isLoginHandled = false;
            return data;
        }
    }

    /*
     * Get the authentication status and ID token claims from the API and return it to the UI for display
     * A successful response contains an isLoggedIn boolean, and a claims object when isLoggedIn is true
     */
    public async getSession(): Promise<any> {
        return await this.fetch('GET', 'session');
    }

    /*
     * Invoked when the SPA wants to trigger a login redirect
     */
    public async startLogin(): Promise<string> {

        const data = await this.fetch('POST', 'login/start', this.getRedirectOptions())
        return data.authorizationRequestUrl;
    }

    /*
     * Invoked when the SPA is on its callback path and the page loads
     * A successful response contains an isLoggedIn=true field and a claims object
     */
    public async endLogin(pageUrl: string): Promise<any> {

        const request = JSON.stringify({
            pageUrl,
        });

        return await this.fetch('POST', 'login/end', request);
    }

    /*
     * Refresh the tokens stored in secure cookies when an API returns a 401 response
     */
    public async refresh(): Promise<void> {
        await this.fetch('POST', 'refresh');
    }

    /*
     * Perform logout actions
     */
    public async logout(): Promise<string> {
        
        const data = await this.fetch('POST', 'logout');
        return data.url;
    }

    /*
     * Call the OAuth Agent and send the cookie credential in a cross-origin request
     * Also send the required custom header than enforces CORS preflights
     */
    private async fetch(method: string, path: string, body: any = null): Promise<any> {

        let url = `${this.backendForFrontendBaseUrl}/oauth-agent/${path}`;
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

        if (body) {
            options.data = body;
        }

        try {

            const response = await axios.request(options);
            if (response.data) {
                return response.data;
            }

            return null;

        } catch (e: any) {

            throw ErrorHandler.handleOAuthError(e);
        }
    }

    /*
     * If required, extra parameters can be provided during authentication redirects like this
     */
    private getRedirectOptions(): any {

        /*return {
            extraParams: [
                {
                    key: 'ui_locales',
                    value: 'sv',
                },
            ]
        };*/

        return null;
    }
}
