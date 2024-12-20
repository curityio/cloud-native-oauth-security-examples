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

import {SerializeOptions, serialize} from 'cookie'
import {getEncryptedCookie} from './cookieEncrypter.js'
import OAuthAgentConfiguration from './oauthAgentConfiguration.js'
import {getATCookieName, getRTCookieName, getIDCookieName} from './cookieName.js'
import {getTempLoginDataCookieForUnset} from './pkce.js'
import InvalidIDTokenException from './exceptions/InvalidIDTokenException.js'

const DAY_MILLISECONDS = 1000 * 60 * 60 * 24

function getCookiesForTokenResponse(tokenResponse: any, config: OAuthAgentConfiguration, unsetTempLoginDataCookie: boolean = false): string[] {
    
    const atCookieOptions = getCookieSerializeOptions(config, 'AT')
    const cookies = [
        getEncryptedCookie(atCookieOptions, tokenResponse.access_token, getATCookieName(config.cookieNamePrefix), config.encKey)
    ]

    if (unsetTempLoginDataCookie) {
        const loginCookieOptions = getCookieSerializeOptions(config, 'LOGIN')
        cookies.push(getTempLoginDataCookieForUnset(loginCookieOptions, config.cookieNamePrefix))
    }

    if (tokenResponse.refresh_token) {
        const rtCookieOptions = getCookieSerializeOptions(config, 'RT')
        cookies.push(getEncryptedCookie(rtCookieOptions, tokenResponse.refresh_token, getRTCookieName(config.cookieNamePrefix), config.encKey))
    }

    if (tokenResponse.id_token) {

        const idCookieOptions = getCookieSerializeOptions(config, 'ID')
        const tokenParts = tokenResponse.id_token.split('.')
        if (tokenParts.length !== 3) {
            throw new InvalidIDTokenException(new Error('ID token is malformed and cannot be written to a cookie'))
        }

        cookies.push(getEncryptedCookie(idCookieOptions, tokenParts[1], getIDCookieName(config.cookieNamePrefix), config.encKey))
    }

    
    return cookies
}

function getCookiesForUnset(config: OAuthAgentConfiguration): string[] {

    const expires = new Date(Date.now() - DAY_MILLISECONDS)
    const atCookieOptions = {
        ...getCookieSerializeOptions(config, 'AT'),
        expires,
    }

    const rtCookieOptions = {
        ...getCookieSerializeOptions(config, 'RT'),
        expires,
    }

    const idCookieOptions = {
        ...getCookieSerializeOptions(config, 'ID'),
        expires,
    }

    return [
        serialize(getATCookieName(config.cookieNamePrefix), "", atCookieOptions),
        serialize(getRTCookieName(config.cookieNamePrefix), "", rtCookieOptions),
        serialize(getIDCookieName(config.cookieNamePrefix), "", idCookieOptions),
    ]
}

function getCookieSerializeOptions(config: OAuthAgentConfiguration, type: string): SerializeOptions {

    return {
        httpOnly: true,
        sameSite: true,
        secure: config.authorizeEndpoint.toLowerCase().startsWith('https'),
        path: getCookiePath(config, type)
    }
}

function getCookiePath(config: OAuthAgentConfiguration, type: string) {

    if (type === 'AT') {
        
        // You can control paths to which the access token cookie is sent
        return config.apiCookieBasePath

    } else if (type === 'RT') {
        
        // The refresh token is sent infrequently - only to a particular endpoint
        return config.endpointsPrefix + '/refresh'

    } else {

        // The ID token cookie and the temporary login cookie use the base path
        return config.endpointsPrefix + '/'
    }
}

export { getCookiesForTokenResponse, getCookiesForUnset, getCookieSerializeOptions }
