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
 * Basic configuration for the code example
 */
export class Configuration {

    // The authorization server's base URL and issuer
    public static readonly authorizationServerBaseUrl = 'http://login.examplecluster.com/oauth/v2';
    public static readonly issuer = `${Configuration.authorizationServerBaseUrl}/oauth-anonymous`;

    // Authorization server endpoints
    public static readonly authorizationEndpoint = `${Configuration.authorizationServerBaseUrl}/oauth-authorize`;
    public static readonly tokenEndpoint = `${Configuration.authorizationServerBaseUrl}/oauth-token`;
    public static readonly jwksEndpoint = `${Configuration.authorizationServerBaseUrl}/oauth-anonymous/jwks`;

    // The OAuth client details the code needs to know
    public static readonly clientId = 'demo-console-client';
    public static readonly redirectUri = 'http://127.0.0.1';
    public static readonly scope = 'openid profile retail/orders'

    // ID token details
    public static readonly algorithm = 'ES256';

    // The API base URL
    public static readonly apiBaseUrl = 'http://api.examplecluster.com/orders';
}
