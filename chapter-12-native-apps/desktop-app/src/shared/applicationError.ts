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

/*
 * A simple error object
 */
export class ApplicationError extends Error {

    private readonly code: string;
    private readonly status: number | null;
    
    public constructor(code: string, message: string, status: number | null = null) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public get errorCode(): string {
        return this.code;
    }

    public get statusCode(): number | null {
        return this.status;
    }

    public toDisplayFormat(): string {
        
        let text = 'Problem encountered';
        if (this.status) {
            text += `, status: ${this.status}`;
        }

        text += `, code: ${this.code}, message: ${this.message}`;
        return text;
    }
}
