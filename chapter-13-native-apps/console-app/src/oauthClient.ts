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

import FindFreePort from 'find-free-port';
import Http from 'http';
import {JWTPayload, JWTVerifyOptions, createRemoteJWKSet, jwtVerify} from 'jose';
import fetch, {Response} from 'node-fetch'
import Opener from 'opener';
import {AuthorizationResponse} from './authorizationResponse.js';
import {Configuration} from './configuration.js';
import {generateHash, generateRandomString} from './cryptoUtils.js';
import {TokenResponse} from './tokenResponse.js';

/*
 * Used for ID token validation later
 */
const remoteJWKSet = createRemoteJWKSet(new URL(Configuration.jwksEndpoint));

/*
 * Do a code flow login to authenticate and get a user level access token
 */
export async function login(): Promise<string> {

    // Find a free port
    const loopbackPort = await findFreePort();
    const redirectUri = `${Configuration.redirectUri}:${loopbackPort}`;

    // Build the authorization request
    const state = generateRandomString();
    const codeVerifier = generateRandomString();
    const codeChallenge = generateHash(codeVerifier);
    const authorizationUrl = buildAuthorizationUrl(redirectUri, state, codeChallenge);

    // Wait for the response from the system browser
    return new Promise<string>((resolve, reject) => {

        let server: Http.Server | null = null;
        const callback = async (request: Http.IncomingMessage, response: Http.ServerResponse) => {

            if (server) {
                
                // Complete the incoming HTTP request when a login response is received
                response.write('Login completed for the console client');
                response.end();
                server.close();
                server = null;

                try {

                    // Protect against cross site request forgery
                    const responseUrl = new URL(request.url || '', `http://${request.headers.host}`);
                    const authorizationResponse = getAuthorizationResponse(responseUrl);
                    if (authorizationResponse.state !== state) {
                        throw new Error('An invalid authorization response state was received');
                    }

                    // Swap the code for tokens, using PKCE to protect against authorization code injection
                    const tokens = await redeemCodeForTokens(authorizationResponse, redirectUri, codeVerifier);

                    // Validate the ID token before accepting tokens
                    const idTokenClaims = await validateIdToken(tokens.idToken);

                    // Return the acess token for display, to make the example look visual
                    resolve(tokens.accessToken);

                } catch (e: any) {

                    // Report any login errors
                    reject(e);
                }
            }
        }

        // Start an HTTP server and listen for the authorization response on a loopback URL, according to RFC8252
        server = Http.createServer(callback);
        server.listen(loopbackPort);
        
        // Open the system browser to begin authentication
        Opener(authorizationUrl);
    });
}

/*
 * Look up a free port to listen on for the authorization response
 */
async function findFreePort(): Promise<number> {

    return new Promise<number>((resolve, reject) => {

        const callback = (err: any, freePort: number) => {

            if (err) {
                return reject(err);
            }

            return resolve(freePort);
        };

        FindFreePort(3000, callback);
    });
}

/*
 * Build a code flow URL for a native console app
 */
function buildAuthorizationUrl(
    redirectUri: string,
    state: string,
    codeChallenge: string): string {

    let requestUrl = Configuration.authorizationEndpoint;
    requestUrl += `?client_id=${encodeURIComponent(Configuration.clientId)}`;
    requestUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    requestUrl += '&response_type=code';
    requestUrl += `&scope=${encodeURIComponent(Configuration.scope)}`;
    requestUrl += `&state=${state}`;
    requestUrl += `&code_challenge=${codeChallenge}`;
    requestUrl += '&code_challenge_method=S256';
    requestUrl += '&prompt=login';

    return requestUrl;
}

/*
 * Get details from the authorization response URL
 */
function getAuthorizationResponse(responseUrl: URL): AuthorizationResponse {

    const args = new URLSearchParams(responseUrl.search);
    const errorCode = args.get('error') || '';
    if (errorCode) {
        
        const errorDescription = args.get('error_description') || '';
        throw new Error(`Problem encountered during authorization, ${errorCode}, ${errorDescription}`);
    }
    
    const code = args.get('code') || '';
    const state = args.get('state') || '';
    if (state && code) {
        return {
            code,
            state,
        };
    }

    throw new Error('An unrecognized response was returned to the console client');
}

/*
 * Swap the code for tokens using PKCE parameters
 * The console app is a native client and does not provide a client credential
 */
async function redeemCodeForTokens(
    authorizationResponse: AuthorizationResponse,
    redirectUri: string,
    codeVerifier: string): Promise<TokenResponse> {

    let body = 'grant_type=authorization_code';
    body += `&client_id=${Configuration.clientId}`;
    body += `&redirect_uri=${redirectUri}`;
    body += `&code=${authorizationResponse.code}`;
    body += `&code_verifier=${codeVerifier}`;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body,
    };

    const response = await fetch(Configuration.tokenEndpoint, options);
    if (response.status !== 200) {
        const details = await getHttpResponseError(response);
        throw new Error(`Problem encountered redeeming the code for tokens, ${details}`);
    }

    const responseJson = await response.json() as any;
    return {
        accessToken: responseJson.access_token,
        refreshToken: responseJson.refresh_token,
        idToken: responseJson.id_token,
    };
}

/*
 * Perform ID token validation, to check the signature, issuer and audience
 */
async function validateIdToken(idToken: string): Promise<JWTPayload> {

    const options = {
        algorithms: [Configuration.algorithm],
        audience: Configuration.clientId,
        issuer: Configuration.issuer,
    } as JWTVerifyOptions;

    const result = jwtVerify(idToken, remoteJWKSet, options);
    return (await result).payload;
}

/*
 * Read the OAuth error and error_description fields from an HTTP response
 */
async function getHttpResponseError(response: Response): Promise<string> {
    
    try {

        const payload = await response.json() as any;
        const errorCode = payload.error || '';
        const errorDescription = payload.error_description || '';
        return `status: ${response.status}, code: ${errorCode}, description: ${errorDescription}`;

    } catch (e: any) {

        return '';
    }
}
