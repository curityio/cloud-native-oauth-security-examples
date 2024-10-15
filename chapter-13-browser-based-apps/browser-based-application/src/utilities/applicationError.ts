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

export class ApplicationError extends Error {

    private readonly status: number;
    private readonly code: string;

    public constructor(status: number, code: string, message: string) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public getStatus(): number {
        return this.status;
    }

    public getCode(): string {
        return this.code;
    }

    /*
     * The access token can expire when calling an API or calling the user info endpoint
     * In this case the next action will be to try a token refresh then retry the API call
     */
    public isAccessTokenExpiredError(): boolean {
        return this.status === 401;
    }

    /*
     * A session expired error means the user must be prompted to re-authenticate
     * - It can happen when the refresh token expires
     * - It can happen in developer setups if the authorization server is redeployed and the refresh token is rejected
     * - It can happen if the cookie encryption key is renewed in the OAuth Agent and OAuth Proxy
     */
    public isSessionExpiredError(): boolean {
        return this.status === 401;
    }
}
