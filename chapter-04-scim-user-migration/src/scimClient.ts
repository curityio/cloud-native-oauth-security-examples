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
import {Customer} from './customer.js';
import {MigrationError} from './migrationError.js';

/*
 * A client to interact with the SCIM endpoint
 */
export class ScimClient {

    private readonly _configuration: Configuration;
    private readonly _accessToken: string;

    public constructor(configuration: Configuration, accessToken: string) {
        this._configuration = configuration;
        this._accessToken = accessToken;
    }

    /*
     * Migrate a customer to create a user account at the authorization server and return the account ID
     * The most standard way to store users in the authorization server is to follow the core schema
     * The schema is also extensible and custom fields can be included in the request data if required
     * https://www.rfc-editor.org/rfc/rfc7643.html#section-4.1
     */
    public async migrateUser(customer: Customer): Promise<string> {
        
        const parts = customer.userName!.split(' ');
        const givenName = parts[0];
        const familyName = parts[1];

        const requestData = {
            
            schemas: [
                'urn:ietf:params:scim:schemas:core:2.0:User',
            ],
            
            // This could be a value entered in password screens
            userName: customer.email,

            // Migrate fields using the SCIM schema
            name: {
                givenName,
                familyName,
            },

            emails: [
                {
                    value: customer.email,
                    primary: true
                }
            ],

            addresses: [
                {
                    country: customer.country
                }
            ],

            roles: [
                {
                    value: customer.roles[0],
                    primary: true,
                },
            ],
            active: true,

            // This could use the standard externalID field but in this example a custom field is used
            customerId: `${customer.id}`,

        } as any;

        try {

            // Send the request and return the response ID
            const responseData = await this._scimRequest('POST', '', requestData);
            return responseData.id;

        } catch (e: any) {

            // On retries, if the same username already exists in the authorization server there is a 409 conflict
            // Alternatively, you could read a list of existing users up front and update existing users with a PUT statement
            if (e.response && e.response.status === 409) {
                return await this.lookupExistingUserId(customer);
            }
            
            throw this._handleError(e);
        }
    }

    /*
     * Return JSON for all users in the authorization server
     */
    public async listAllUsers(): Promise<string> {

        try {

            const responseData = await this._scimRequest('GET');
            return responseData.Resources;

        } catch (e: any) {

            throw this._handleError(e);
        }
    }

    /*
     * Remove a user from the authorization server
     */
    public async deleteUser(customer: Customer): Promise<string> {

        const id = await this.lookupExistingUserId(customer);
        if (id) {
            await this._scimRequest('DELETE', `/${id}`);
            return id;
        }

        return id;
    }

    /*
     * Given a user that exists in the authorization server, look up the existing user ID
     */
    public async lookupExistingUserId(customer: Customer): Promise<string> {
        
        try {

            const filter = encodeURIComponent(`filter=customerId eq "${customer.id}"`);
            const responseData = await this._scimRequest('GET', `?${filter}`);

            if (responseData.Resources[0]) {
                return responseData.Resources[0].id;
            }

            return '';

        } catch (e: any) {

            throw this._handleError(e);
        }
    }

    /*
     * Make a SCIM request and return results as an object
     */
    private async _scimRequest(method: string, path: string = '', data: any = null): Promise<any> {

        let url = this._configuration.scimEndpoint;
        if (path) {
            url += path;
        }

        const options = {
            url,
            method,
            headers: {
                'authorization': `Bearer ${this._accessToken}`,
                'content-type': 'application/scim+json',
                'accept': 'application/scim+json',
            },
        } as AxiosRequestConfig;

        if (data) {
            options.data = data;
        }

        const authorizationServerResponse = await axios.request(options);
        return authorizationServerResponse.data;
    }

    /*
    * Return an error details from a SCIM response
    */
    private _handleError(e: any): MigrationError {

        let message = 'SCIM request failed';
        if (e.response && e.response.data) {
            return new MigrationError(message, e.response.data);
        }

        if (e.response && e.response.status) {

            message += `, status: ${e.response.status}`;

        } else {

            message += ', unable to connect to the authorization server';
        }

        return new MigrationError(message);
    }
}
