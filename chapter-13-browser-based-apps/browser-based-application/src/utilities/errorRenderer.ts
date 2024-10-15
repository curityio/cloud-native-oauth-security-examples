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

export class ErrorRenderer {

    public static toDisplayFormat(error: any): string {

        let status = 0;
        let code = '';
        let details = '';

        if (error instanceof ApplicationError) {

            status = error.getStatus();
            code = error.getCode()
            details = error.message;
        }
        else {

            if (error.status) {
                status = error.status;
            }
            details = error.message || '';
        }

        const parts = [];
        parts.push('Problem encountered');

        if (status) {
            parts.push(`status: ${status}`);
        }

        if (code) {
            parts.push(`code: ${code}`);
        }

        if (details) {
            parts.push(`details: ${details}`);
        }

        return parts.join(', ');
    }
}
