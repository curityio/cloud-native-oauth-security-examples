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

import {Request, Response, NextFunction} from 'express';
import {createRemoteJWKSet, JWTVerifyGetKey, JWTVerifyOptions, jwtVerify} from 'jose';
import {Configuration} from '../configuration.js';
import {ApiError} from '../errors/apiError.js';
import {ObjectFactory} from '../logic/objectFactory.js';
import {ClaimsPrincipal} from './claimsPrincipal.js';

/*
 * The base OAuth work to authenticate API requests and make basic checks
 */
export class OAuthFilter {

    private readonly configuration: Configuration;
    private readonly objectFactory: ObjectFactory;
    private readonly remoteJwksSet: JWTVerifyGetKey;

    public constructor(configuration: Configuration, objectFactory: ObjectFactory) {

        this.configuration = configuration;
        this.objectFactory = objectFactory;
        
        // During integration tests, this ensures that the API calls the JWKS URI at the start of every test run
        let options: any = undefined;
        if (process.env.NODE_ENV === 'development') {
            options = {
                cooldownDuration: 0,
            };
        }

        this.remoteJwksSet = createRemoteJWKSet(new URL(configuration.jwksUri), options);
        this.validateAccessToken = this.validateAccessToken.bind(this);
    }

    /*
     * Validate a JWT according to best practices and then prepare authorization
     */
    public async validateAccessToken(request: Request, response: Response, next: NextFunction): Promise<void> {

        const accessToken = this.readAccessToken(request);
        if (!accessToken) {
            throw new ApiError(401, 'invalid_token', 'Missing, invalid or expired access token');
        }

        const options = {
            issuer: this.configuration.requiredIssuer,
            audience: this.configuration.requiredAudience,
            algorithms: [this.configuration.requiredJwtAlgorithm],
        } as JWTVerifyOptions;

        let result: any
        try {

            // STEP 1: validate the access token while following best practices
            result = await jwtVerify(accessToken, this.remoteJwksSet, options);

        } catch (ex: any) {

            throw new ApiError(401, 'invalid_token', 'Missing, invalid or expired access token', ex);
        }

        // STEP 2: enforce required scopes
        const claimsPrincipal = new ClaimsPrincipal(result.payload);
        claimsPrincipal.enforceRequiredScope(this.configuration.requiredScope);

        // STEP 3: set up code to support business authorization
        if (this.configuration.authorizationStrategy === 'policy') {
            response.locals.authorizer = this.objectFactory.createPolicyAuthorizer(this.configuration,accessToken);
        } else {
            response.locals.authorizer = this.objectFactory.createCodeAuthorizer(claimsPrincipal);
        }

        next();
    }

    /*
     * Read the access token from the HTTP authorization header
     */
    private readAccessToken(request: Request): string | null {

        const authorizationHeader = request.header('authorization');
        if (authorizationHeader) {
            const parts = authorizationHeader.split(' ');
            if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
                return parts[1];
            }
        }

        return null;
    }
}
