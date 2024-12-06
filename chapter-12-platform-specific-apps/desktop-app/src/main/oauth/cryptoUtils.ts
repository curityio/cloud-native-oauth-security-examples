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

import crypto from 'crypto'

export function generateRandomString(): string {
    
    return urlEncode(crypto.randomBytes(32).toString('base64'));
}

export function generateHash(data: string): string {
    
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return urlEncode(hash.digest('base64'));
}

export function urlEncode(data: string): string {
    
    return data
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');}
