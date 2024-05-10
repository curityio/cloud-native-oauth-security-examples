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
import {Configuration} from './configuration.js';
import {MigrationError} from './migrationError.js';

/*
 * A client to interact with the token endpoint and manage authentication
 */
export class TokenClient {

    private readonly _configuration: Configuration;

    public constructor(configuration: Configuration) {
        this._configuration = configuration;
    }

    /*
    * Run a client credentials flow to get an access token with SCIM privileghes
    */
    public async authenticate(): Promise<string> {

        const data = new URLSearchParams();
        data.append('grant_type', 'client_credentials');
        data.append('client_id', this._configuration.clientId);
        data.append('client_secret', this._configuration.clientSecret);
        data.append('scope', this._configuration.scope);

        const options = {
            url: this._configuration.tokenEndpoint,
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'accept': 'application/json',
            },
            data,
        } as AxiosRequestConfig;

        try {

            const authorizationServerResponse = await axios.request(options);
            return authorizationServerResponse.data.access_token;

        } catch (e: any) {

            throw this._handleError(e);
        }
    }

    /*
    * Return an error for a token request
    */
    private _handleError(e: any): MigrationError {

        let message = 'Client credentials flow failed';
        if (e.response && e.response.status) {
            
            message += `, status: ${e.response.status}`;
            if (e.response.data && e.response.data.error) {
                message += `, error: ${e.response.data.error}`;
            }

        } else {

            message += ', unable to connect to the authorization server';
        }

        return new MigrationError(message);
    }
}
