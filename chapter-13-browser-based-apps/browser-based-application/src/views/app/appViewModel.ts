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

import {ApiClient} from '../../api/apiClient';
import {Configuration} from '../../configuration';
import {OAuthClient} from '../../oauth/oauthClient';
import {PageLoadResponse} from '../../utilities/pageLoadResponse';
import {ApplicationError} from '../../utilities/applicationError';

export class AppViewModel {

    public configuration!: Configuration;
    public oauthClient!: OAuthClient;
    public apiClient!: ApiClient;
    public isLoaded: boolean;
    public pageLoadResponse: PageLoadResponse | null;

    public constructor() {
        this.isLoaded = false;
        this.pageLoadResponse = null;
    }

    /*
     * Download configuration from the web host to get the backend for frontend details
     */
    public async loadConfiguration(): Promise<void> {

        if (!this.isLoaded) {

            const response = await fetch('config.json');
            this.configuration = await response.json() as Configuration;
            this.oauthClient = new OAuthClient(this.configuration.backendForFrontendBaseUrl);
            this.apiClient = new ApiClient(this.configuration.backendForFrontendBaseUrl, this.oauthClient);
            this.isLoaded = true;
        }
    }

    /*
     * Handle the page load event when the SPA starts
     */
    public async handlePageLoad(): Promise<void> {

        try {

            this.pageLoadResponse =  await this.oauthClient.handlePageLoad(location);
        
        } catch (e: any) {

            if (e instanceof ApplicationError && e.isSessionExpiredError()) {

                this.pageLoadResponse = {
                    isLoggedIn: false,
                    isLoginHandled: false,
                }
                
            } else {
                throw e;
            }

        } finally {
            
            // After handling a login, the SPA navigates back to its last saved path
            if (this.pageLoadResponse?.isLoginHandled) {
                history.replaceState({}, document.title, '/');
            }
        }
    }
}
