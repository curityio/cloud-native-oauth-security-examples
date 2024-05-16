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

import express from 'express';
import http from 'http';
import {generateKeyPair, exportJWK, KeyLike, SignJWT, GenerateKeyPairResult, JWTPayload} from 'jose';
import {v4 as uuidv4} from 'uuid';
import {TokenProperties} from './tokenProperties';

/*
 * Demonstrate a mocking technique for productive use of tokens when testing zero trust APIs
 */
export class MockAuthorizationServer {

    private httpServer: http.Server | null = null;
    private httpServerPort = 3001;
    private algorithm = 'ES256';
    private keypair: GenerateKeyPairResult<KeyLike> | null = null;
    private keyIdentifier: string | null = null;

    /*
     * Start a mock authorization server that publishes a JSON Web Key Set
     */
    public async start(): Promise<void> {

        const application = express();
        
        const jwks = await this.generateKeys();
        application.get('/jwks', (request, response) => {

            response.setHeader('Content-Type', 'application/json');
            response.status(200).send(JSON.stringify(jwks));
        });

        this.httpServer = application.listen(this.httpServerPort);
    }

    /*
     * Close down the HTTP server at the end of a test run
     */
    public async stop(): Promise<void> {
        this.httpServer?.close();
    }

    /*
     * Simulates a token being returned to the OAuth client after user authentication
     * Input properties enables API integration tests to test various security scenarios
     */
    public async issueMockAccessToken(
        properties: TokenProperties,
        maliciousKeypair: GenerateKeyPairResult<KeyLike> | null = null): Promise<string> {

        const keypairToUse = maliciousKeypair || this.keypair;

        // Add standard claims
        const payload: JWTPayload = {

            iss: properties.iss,
            aud: properties.aud,
            scope: properties.scope,
            sub: properties.sub,
        };

        // Add custom claims when supplied
        if (properties.customerId) {
            payload.customer_id = properties.customerId;
        }
        if (properties.roles) {
            payload.roles = properties.roles;
        }
        if (properties.region) {
            payload.region = properties.region;
        }
        if (properties.levelOfAssurance) {
            payload.level_of_assurance = properties.levelOfAssurance;
        }

        return await new SignJWT(payload)
            .setProtectedHeader( { kid: this.keyIdentifier!, alg: this.algorithm } )
            .setIssuedAt(properties.iat)
            .setExpirationTime(properties.exp)
            .sign(keypairToUse!.privateKey);
    }

    /*
     * Create a keypair, hold onto the private key and return a JSON Web Key Set with the public key
     * Every test run uses a new kid, that triggers a JWKS download in the API
     */
    private async generateKeys(): Promise<any> {

        this.keypair = await generateKeyPair(this.algorithm);
        this.keyIdentifier = uuidv4();

        const jwk = await exportJWK(this.keypair.publicKey!);
        jwk.kid = this.keyIdentifier!;
        jwk.alg = this.algorithm;
        return {
            keys: [
                jwk,
            ],
        };
    }
}
