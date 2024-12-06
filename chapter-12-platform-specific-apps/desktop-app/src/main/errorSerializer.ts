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

import {ApplicationError} from '../shared/applicationError';

export function serializeError(e: any): string {

    if (e instanceof ApplicationError) {
        
        return JSON.stringify({
            code: e.errorCode,
            message: e.message,
            status: e.statusCode,
        });
    }

    return JSON.stringify({
        code: 'main_error',
        message: e.message || 'General problem encountered',
    });

}
