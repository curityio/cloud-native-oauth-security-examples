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

import {JWTPayload, jwtVerify, JWTVerifyGetKey, JWTVerifyOptions} from 'jose'
import OAuthAgentConfiguration from './oauthAgentConfiguration.js'
import InvalidIDTokenException from './exceptions/InvalidIDTokenException.js';

/*
 * Validate the ID token and require one, since the OAuth Agent provides an OpenID Connect solution
 */
export default async function validateIDToken(config: OAuthAgentConfiguration, idToken: string, remoteJwkSet: JWTVerifyGetKey): Promise<JWTPayload> {

    const options = {
        algorithms: [config.idTokenAlgorithm],
        audience: config.clientID,
        issuer: config.issuer,
    } as JWTVerifyOptions;
    
    try {
        const result = await jwtVerify(idToken, remoteJwkSet, options);
        return result.payload;
    
    } catch (err: any) {
        throw new InvalidIDTokenException(err)
    }
}
