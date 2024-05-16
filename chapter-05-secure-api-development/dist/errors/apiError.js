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
import * as jose from 'jose';
/*
 * A simple error class
 */
export class ApiError extends Error {
    status;
    code;
    extra;
    constructor(status, code, message, extra = null) {
        super(message);
        this.status = status;
        this.code = code;
        this.extra = extra;
    }
    toClientJson() {
        return {
            status: this.status,
            code: this.code,
            message: this.message,
        };
    }
    toLogJson() {
        return {
            status: this.status,
            code: this.code,
            message: this.message,
            details: this.getDetails(),
        };
    }
    getDetails() {
        if (this.extra instanceof jose.errors.JOSEError) {
            return `${this.extra.code}, ${this.extra.message}`;
        }
        if (typeof this.extra === 'string') {
            return this.extra;
        }
        return '';
    }
}
