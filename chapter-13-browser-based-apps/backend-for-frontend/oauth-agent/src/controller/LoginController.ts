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

import express from 'express'
import { JWTVerifyGetKey } from 'jose'
import {
    createAuthorizationRequest,
    handleAuthorizationResponse,
    validateIDToken,
    getTokenEndpointResponse,
    getTempLoginDataCookie,
    getTempLoginDataCookieName,
    getCookiesForTokenResponse,
    getIDCookieName,
    getIDTokenClaimsFromCookie,
    getCookieSerializeOptions
} from '../lib/index.js'
import {config} from '../config.js'
import validateExpressRequest from '../validateExpressRequest.js'
import {asyncCatch} from '../middleware/exceptionMiddleware.js'

class LoginController {
    
    private readonly remoteJwkSet: JWTVerifyGetKey;
    public router = express.Router()

    constructor(remoteJwkSet: JWTVerifyGetKey) {
        this.remoteJwkSet = remoteJwkSet
        this.router.post('/start', asyncCatch(this.startLogin))
        this.router.post('/end', asyncCatch(this.endLogin))
    }

    /*
     * The SPA calls this endpoint to ask the OAuth Agent for the authorization request URL
     */
    startLogin = async (req: express.Request, res: express.Response) => {

        validateExpressRequest(req)

        const authorizationRequestData = createAuthorizationRequest(config, req.body)

        const loginCookieOptions = getCookieSerializeOptions(config, 'LOGIN')
        res.setHeader('Set-Cookie',
            getTempLoginDataCookie(authorizationRequestData.codeVerifier, authorizationRequestData.state, loginCookieOptions, config.cookieNamePrefix, config.encKey))
        res.status(200).json({
            authorizationRequestUrl: authorizationRequestData.authorizationRequestURL
        })
    }

    /*
     * The SPA posts its URL here when its /callback path is invoked
     * If the user happens to manually browse to that path, return a session response
     */
    endLogin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

        validateExpressRequest(req)
        
        const data = await handleAuthorizationResponse(req.body?.pageUrl)
        let isLoggedIn = false
        let claims: Object | null = null;

        if (data.code && data.state) {
            
            const tempLoginData = req.cookies ? req.cookies[getTempLoginDataCookieName(config.cookieNamePrefix)] : undefined
            
            const tokenResponse = await getTokenEndpointResponse(config, data.code, data.state, tempLoginData)
            claims = await validateIDToken(config, tokenResponse.id_token, this.remoteJwkSet)
            isLoggedIn = true

            const cookiesToSet = getCookiesForTokenResponse(tokenResponse, config, true)
            res.set('Set-Cookie', cookiesToSet)

        } else {

            if (req.cookies) {

                const idCookie = req.cookies[getIDCookieName(config.cookieNamePrefix)]
                if (idCookie) {
                    isLoggedIn = true
                    claims = getIDTokenClaimsFromCookie(config.encKey, idCookie)
                }
            }
        }

        const responseBody: any = {
            isLoggedIn,
        }
        if (claims) {
            responseBody.claims = claims
        }
        
        res.status(200).json(responseBody)
    }
}

export default LoginController