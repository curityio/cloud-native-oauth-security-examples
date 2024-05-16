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
 * Configuration settings for the code example
 */
export class Configuration {

    public port: number;
    public jwksUri: string;
    public requiredJwtAlgorithm: string;
    public requiredIssuer: string;
    public requiredAudience: string;
    public requiredScope: string;
    public authorizationStrategy: string;
    public policyEndpoint: string

    public constructor() {

        this.port = parseInt(this.getValue('PORT'));
        this.jwksUri = this.getValue('JWKS_URI');
        this.requiredJwtAlgorithm = this.getValue('REQUIRED_JWT_ALGORITHM');
        this.requiredIssuer = this.getValue('REQUIRED_ISSUER');
        this.requiredAudience = this.getValue('REQUIRED_AUDIENCE');
        this.requiredScope = this.getValue('REQUIRED_SCOPE');
        this.authorizationStrategy = this.getValue('AUTHORIZATION_STRATEGY', 'code');
        
        if (this.authorizationStrategy === 'policy') {
            this.policyEndpoint = this.getValue('POLICY_ENDPOINT');
        } else {
            this.policyEndpoint = '';
        }
    }

    private getValue(name: string, defaultValue = ''): string {
        
        const value = process.env[name] || defaultValue;
        if (!value) {
            throw new Error(`The environment variable ${name} has not been set`)
        }

        return value!;
    }
}
