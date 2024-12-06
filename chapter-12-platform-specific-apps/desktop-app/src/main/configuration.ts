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
    public static readonly clientId = 'demo-desktop-client';
    public static readonly scope = 'openid profile retail/orders';
    public static readonly loopbackHostname = '127.0.0.1';
    public static readonly authorizationServerBaseUrl = 'https://login.democluster.example/oauth/v2/oauth-anonymous';
    public static readonly idTokenAlgorithm = 'ES256';
    public static readonly apiBaseUrl = 'https://api.democluster.example/orders';
}
