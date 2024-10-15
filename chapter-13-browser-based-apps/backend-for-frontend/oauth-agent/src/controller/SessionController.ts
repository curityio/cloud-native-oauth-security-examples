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
import {getIDCookieName, getIDTokenClaimsFromCookie} from '../lib/index.js'
import {config} from '../config.js'
import validateExpressRequest from '../validateExpressRequest.js'
import {asyncCatch} from '../middleware/exceptionMiddleware.js'

class SessionController {
    public router = express.Router()

    constructor() {
        this.router.get('/', asyncCatch(this.getClaims))
    }

    getClaims = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

        validateExpressRequest(req)

        let isLoggedIn: boolean = false
        let claims: any = null

        if (req.cookies) {

            const idCookie = req.cookies[getIDCookieName(config.cookieNamePrefix)]
            if (idCookie) {
                isLoggedIn = true
                claims = getIDTokenClaimsFromCookie(config.encKey, idCookie)
            }
        }

        const responseBody: any = {
            isLoggedIn,
        }
        if(claims) {
            responseBody.claims = claims
        }

        res.status(200).json(responseBody)
    }
}

export default SessionController
