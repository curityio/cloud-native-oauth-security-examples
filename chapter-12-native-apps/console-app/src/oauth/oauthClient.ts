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
import {JWTPayload, JWTVerifyOptions, createRemoteJWKSet, jwtVerify} from 'jose';
import {ApplicationError} from '../applicationError.js';
import {Configuration} from '../configuration.js';
import {AuthorizationResponse} from './authorizationResponse.js';
import {generateHash, generateRandomString} from './cryptoUtils.js';
import {LoginRequestResponse} from './loginRequestResponse.js';
import {TokenResponse} from './tokenResponse.js';

/*
 * Used for ID token validation later
 */
const remoteJWKSet = createRemoteJWKSet(new URL(Configuration.jwksEndpoint));

/*
 * Do a code flow login to authenticate and get a user level access token
 */
export async function login(): Promise<string> {

    const loginRequestResponse = new LoginRequestResponse();
    
    // Get runtime values to build the authorization request URL
    const state = generateRandomString();
    const codeVerifier = generateRandomString();
    const redirectUri = await loginRequestResponse.start();
    const authorizationRequestUrl = buildAuthorizationRequestUrl(
        state,
        generateHash(codeVerifier),
        redirectUri);

    // Run a login request on the system browser and receive the response in a loopback web server
    const authorizationResponseUrl = await loginRequestResponse.login(authorizationRequestUrl);

    // Process the response and make the standard OAuth CSRF check
    const authorizationResponse = getAuthorizationResponse(authorizationResponseUrl);
    if (authorizationResponse.state !== state) {
        throw new ApplicationError('invalid_state', 'An invalid authorization response state was received');
    }

    // Get tokens, validate the ID token and then save tokens
    const tokens = await redeemCodeForTokens(authorizationResponse, redirectUri, codeVerifier);
    await validateIdToken(tokens.idToken);
    return tokens.accessToken;
}

/*
 * Build a code flow URL for a native console app
 */
function buildAuthorizationRequestUrl(
    state: string,
    codeChallenge: string,
    redirectUri: string): string {

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
        
        const errorMessage = args.get('error_description') || 'Authorization response error';
        throw new ApplicationError(errorCode, errorMessage);
    }
    
    const code = args.get('code') || '';
    const state = args.get('state') || '';
    if (state && code) {
        return {
            code,
            state,
        };
    }

    throw new ApplicationError(
        'invalid_response',
        'An unrecognized response was returned to the callback URL of the console client');
}

/*
 * Swap the code for tokens using PKCE parameters
 * The console app is a native client and does not provide a client credential
 */
async function redeemCodeForTokens(
    authorizationResponse: AuthorizationResponse,
    redirectUri: string,
    codeVerifier: string): Promise<TokenResponse> {

    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', Configuration.clientId);
    formData.append('redirect_uri', redirectUri);
    formData.append('code', authorizationResponse.code);
    formData.append('code_verifier', codeVerifier);

    const options = {
        url: Configuration.tokenEndpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        },
        data: formData,
    } as AxiosRequestConfig;

    try {

        const response = await axios(options);
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            idToken: response.data.id_token,
        };

    } catch (e: any) {

        let code = 'oauth_error';
        let message = 'OAuth request error';
        let status: number | null = null;
        if (e.response) {

            if (e.response.status) {
                status = e.response.status;
            }

            console.log(e.response.data);
            if (e.response.data) {
            
                if (e.response.data.error) {
                    code = e.response.data.error;
                }

                if (e.response.data.error_description) {
                    message += `: ${e.response.data.error_description}`;
                }
            }
        }
        
        throw new ApplicationError(code, message, status);
    }
}

/*
 * Perform ID token validation, to check the signature, issuer and audience
 */
async function validateIdToken(idToken: string): Promise<JWTPayload> {

    const options = {
        algorithms: [Configuration.idTokenAlgorithm],
        audience: Configuration.clientId,
        issuer: Configuration.issuer,
    } as JWTVerifyOptions;

    const result = await jwtVerify(idToken, remoteJWKSet, options);
    return result.payload;
}
