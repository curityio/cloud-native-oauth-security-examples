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
import { ApiError } from './apiError.js';
/*
 * Basic error handling and logging
 */
export class ErrorHandler {
    /*
     * Catch thrown exceptions
     */
    static onUnhandledException(unhandledException, request, response) {
        const apiError = ErrorHandler.getApiError(unhandledException);
        ErrorHandler.writeErrorResponse(apiError, response);
    }
    /*
     * Express does not catch exceptions in async handlers so we use this override
     */
    static catch(fn) {
        return (request, response, next) => {
            Promise
                .resolve(fn(request, response, next))
                .catch((e) => {
                ErrorHandler.onUnhandledException(e, request, response);
            });
        };
    }
    /*
     * Create an error on demand
     */
    static writeErrorResponse(apiError, response) {
        ErrorHandler.logError(apiError);
        if (apiError.status === 401 || apiError.status == 403) {
            ErrorHandler.writeAuthenticateHeader(apiError, response);
        }
        response.setHeader('Content-Type', 'application/json');
        response.status(apiError.status).send(JSON.stringify(apiError.toClientJson()));
    }
    /*
     * Write standard OAuth error response headers
     */
    static writeAuthenticateHeader(apiError, response) {
        if (apiError.status === 401 || apiError.status === 403) {
            response.setHeader('WWW-Authenticate', `Bearer, error=${apiError.code}, error_description=${apiError.message}`);
        }
    }
    /*
     * Get a caught error into a typed error
     */
    static getApiError(unhandledException) {
        if (unhandledException instanceof ApiError) {
            return unhandledException;
        }
        return new ApiError(500, 'server_error', 'Problem encountered in the API', unhandledException.message);
    }
    /*
     * Log errors in the API
     */
    static logError(error) {
        console.log(JSON.stringify(error.toLogJson(), null, 2));
    }
}
