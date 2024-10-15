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

/*
 * Properties that camn be overridden for testing, to verify that the API handles OAuth security conditions correctly
 */
export class TokenProperties {
    
    // Default to the API's expected issuer
    public iss = 'https://login.example.com';

    // Default to the API's expected audience
    public aud = 'api.example.com';

    // Default to correct scopes for the API
    public scope = 'openid retail/orders';

    // Default to an access token issued 60 seconds ago
    public iat = Date.now() - 60 * 1000
    
    // Default to an access token that will expire in 15 minutes time
    public exp = Date.now() + 15 * 60 * 1000

    // A default subject claim
    public sub = '6879f123-897e-4551-90a3-d8d9a605d65d';
    
    // The business user identity is empty by default
    public customerId: string | null = null;

    // A default roles claim
    public roles: string[] | undefined = ['customer'];

    // A default region claim
    public region: string | undefined = 'USA';

    // A default authentication strength
    public levelOfAssurance: number | undefined = 1;
}
