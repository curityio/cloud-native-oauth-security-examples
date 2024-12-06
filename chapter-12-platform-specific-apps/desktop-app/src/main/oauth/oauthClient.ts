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
import {JWTVerifyOptions, createRemoteJWKSet, jwtVerify, JWTVerifyGetKey, JWTPayload} from 'jose';
import {ApplicationError} from '../../shared/applicationError';
import {Configuration} from '../configuration';
import {AuthorizationResponse} from './authorizationResponse';
import {generateHash, generateRandomString} from './cryptoUtils';
import {LoginRequestResponse} from './loginRequestResponse';
import {OpenIdConnectMetadata} from './metadata';
import {TokenResponse} from './tokenResponse';

/*
 * An object to deal with OAuth lifecycle operations and in memory storage of any state
 */
export class OAuthClient {

    private metadata: OpenIdConnectMetadata | null = null;
    private loginRequestResponse = new LoginRequestResponse();
    private remoteJWKSet: JWTVerifyGetKey | null = null;
    private tokens: TokenResponse | null  = null;
    private idTokenClaims: JWTPayload | null = null;

    /*
     * Initialize the application when it starts
     */
    public async initialize(): Promise<any> {
        
        // Download OpenID Connect metadata if required
        if (!this.metadata) {
        
            const url = `${Configuration.authorizationServerBaseUrl}/.well-known/openid-configuration`;
            const response = await this.callAuthorizationServer('metadata', 'GET', url);

            this.metadata = {
                issuer: response.issuer,
                authorizationEndpoint: response.authorization_endpoint,
                tokenEndpoint: response.token_endpoint,
                jwksEndpoint: response.jwks_uri,
                userInfoEndpoint: response.userinfo_endpoint,
            };

            this.remoteJWKSet = createRemoteJWKSet(new URL(this.metadata!.jwksEndpoint));
        }

        // Indicate authenticated if there are tokens
        return {
            isLoggedIn: !!this.tokens,
        }
    }

    /*
     * Run a login and save tokens in memory
     */
    public async login(): Promise<JWTPayload> {

        // Get runtime values to build the authorization request URL
        const state = generateRandomString();
        const codeVerifier = generateRandomString();
        const redirectUri = await this.loginRequestResponse.initialize();
        const authorizationRequestUrl = this.buildAuthorizationRequestUrl(
            state,
            generateHash(codeVerifier),
            redirectUri);

        // Execute the login request on the system browser and receive the response in a loopback web server
        const authorizationResponseUrl = await this.loginRequestResponse.execute(authorizationRequestUrl);

        // Process the response and make the standard OAuth CSRF check
        const authorizationResponse = this.getAuthorizationResponse(authorizationResponseUrl);
        if (authorizationResponse.state !== state) {
            throw new ApplicationError('invalid_state', 'An invalid authorization response state was received');
        }

        // Get tokens, validate the ID token and then save tokens
        const tokens = await this.redeemCodeForTokens(authorizationResponse, redirectUri, codeVerifier);
        this.tokens = tokens;
        this.idTokenClaims = await this.validateIdToken(tokens.idToken);
        return this.idTokenClaims;
    }

    /*
     * Provide the userinfo endpoint to the API client
     */
    public getUserInfoEndpoint(): string {
        return this.metadata!.userInfoEndpoint;
    }

    /*
     * Provide ID token claims to the rest of the app
     */
    public getAccessToken(): string | undefined {
        return this.tokens?.accessToken;
    }

    /*
     * Handle token refresh for the public client, without a client credential
     * Anew access token and a new refresh token are returned
     */
    public async refreshAccessToken(): Promise<void> {

        let body = 'grant_type=refresh_token';
        body += `&client_id=${Configuration.clientId}`;
        body += `&refresh_token=${this.tokens!.refreshToken}`;

        const response = await this.callAuthorizationServer(
            'refresh_token_grant',
            'POST',
            this.metadata!.tokenEndpoint,
            body);

        this.tokens!.accessToken = response.access_token;
        if (response.refresh_token) {
            this.tokens!.refreshToken = response.refresh_token;
        }
        if (response.id_token) {
            this.tokens!.idToken = response.id_token;
        }
    }

    /*
     * Do a basic logout to just remove tokens
     */
    public async logout(): Promise<void> {

        this.tokens = null;
        this.idTokenClaims = null;
    }

    /*
     * Build the parameters of the authorization request URL
     * Force a login every time with the prompt parameter to ensure that the browser returns to the app
     */
    private buildAuthorizationRequestUrl(state: string, codeChallenge: string, redirectUri: string): string {

        let requestUrl = this.metadata!.authorizationEndpoint;
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
    private getAuthorizationResponse(authorizationResponseUrl: URL): AuthorizationResponse {

        const args = new URLSearchParams(authorizationResponseUrl.search);
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
     * Swap the code for tokens using PKCE and return the access token
     * The desktop app is a native client and does not provide a client credential
     */
    private async redeemCodeForTokens(
        authorizationResponse: AuthorizationResponse,
        redirectUri: string,
        codeVerifier: string): Promise<TokenResponse> {
        
        let body = 'grant_type=authorization_code';
        body += `&client_id=${Configuration.clientId}`;
        body += `&redirect_uri=${redirectUri}`;
        body += `&code=${authorizationResponse.code}`;
        body += `&code_verifier=${codeVerifier}`;

        const response = await this.callAuthorizationServer(
            'authorization_code_grant',
            'POST',
            this.metadata!.tokenEndpoint,
            body);

        return {
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            idToken: response.id_token,
        };
    }

    /*
     * Perform ID token validation, to check the signature, issuer and audience
     */
    private async validateIdToken(idToken: string): Promise<JWTPayload> {

        const options = {
            algorithms: [Configuration.idTokenAlgorithm],
            audience: Configuration.clientId,
            issuer: this.metadata?.issuer,
        } as JWTVerifyOptions;

        try {
            const result = await jwtVerify(idToken, this.remoteJWKSet!, options);
            return result.payload;

        } catch (e: any) {
            throw new ApplicationError('id_token_validation_error', e.message);
        }
    }

    /*
     * Make an HTTP request to the authorization server and receive JSON
     */
    private async callAuthorizationServer(
        operation: string,
        method: string,
        url: string,
        requestData: any = null): Promise<any> {

        const options: any = {
            url,
            method,
            headers: {
                Accept: 'application/json',
            },
            data: requestData,
        }  as AxiosRequestConfig;

        if (requestData) {
            options.body = requestData;
            options.headers['content-type'] = 'application/x-www-form-urlencoded';
        }

        try {
            
            let response = await axios(options);
            return response.data;

        } catch (e: any) {
            
            let code = `${operation}_error`;
            let message = 'OAuth request error';
            let status: number | null = null;
            if (e.response) {

                if (e.response.status) {
                    status = e.response.status;
                }

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
}
