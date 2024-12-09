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

    // The OAuth client details
    public static readonly clientId = 'demo-console-client';
    public static readonly scope = 'openid profile retail/orders'

    // The authorization server's external base URL
    public static readonly authorizationServerBaseUrl = 'https://login.democluster.example';

    // Authorization server endpoints for user authentication
    public static readonly authorizationEndpoint = `${Configuration.authorizationServerBaseUrl}/oauth/v2/oauth-authorize`;
    public static readonly tokenEndpoint = `${Configuration.authorizationServerBaseUrl}/oauth/v2/oauth-token`;
    
    // Details needed for ID token validation
    public static readonly issuer = `${Configuration.authorizationServerBaseUrl}/oauth/v2/oauth-anonymous`;
    public static readonly jwksEndpoint = `${Configuration.authorizationServerBaseUrl}/oauth/v2/oauth-anonymous/jwks`;
    public static readonly idTokenAlgorithm = 'ES256';

    // The API base URL
    public static readonly apiBaseUrl = 'https://api.democluster.example/orders';
}
