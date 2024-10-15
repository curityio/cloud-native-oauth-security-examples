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

import {decryptCookie} from './cookieEncrypter.js'
import {InvalidIDTokenException} from './exceptions/index.js'

function getIDTokenClaimsFromCookie(encKey: string, encryptedCookie: string): Object {

    const idTokenPayload = decryptCookie(encKey, encryptedCookie)

    try {
        return JSON.parse(String(Buffer.from(idTokenPayload, 'base64').toString('binary')))
    } catch (err: any) {
        throw new InvalidIDTokenException(new Error('The ID token payload could not be parsed'))
    }
}

export default getIDTokenClaimsFromCookie
