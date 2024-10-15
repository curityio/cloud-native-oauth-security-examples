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

import {ApplicationError} from './applicationError';

export class ErrorHandler {

    public static handleApiError(e: any): ApplicationError {
        return ErrorHandler.handleFetchError('API', 'api_error', e);
    }

    public static handleOAuthError(e: any): ApplicationError {
        return ErrorHandler.handleFetchError('OAuth', 'oauth_error', e);
    }

    /*
     * Handle errors calling the OAuth Agent
     */
    public static handleFetchError(type: string, codeParam: string, e: any): ApplicationError {

        if (e instanceof ApplicationError) {
            return e;
        }

        let status = 0;
        let code = codeParam;
        let message = `${type} request error`;

        if (e.response) {

            if (e.response.status) {
                status = e.response.status;
            }

            if (e.response.data && typeof e.response.data === 'object') {

                if (e.response.data.code) {
                    code = e.response.data.code;
                }

                if (e.response.data.message) {
                    message += `: ${e.response.data.message}`;
                }
            }
        }

        return new ApplicationError(status, code, message);
    }
}
