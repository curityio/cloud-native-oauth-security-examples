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

import React from 'react';
import {ClaimsProps} from './claimsProps';

export function ClaimsView(props: ClaimsProps) {

    function getAuthenticationTime(): string {

        if (!props.claims) {
            return 'No ID token claims issued';
        }

        return `auth_time: ${new Date(props.claims.auth_time * 1000).toISOString()}`
    }

    return (

        <div className='container'>
            <h2>ID Token Claims</h2>
            <p>The SPA can get its ID token claims from the OAuth Agent when the page loads.</p>
            <div>
                <p id='getClaimsResult' className='alert alert-success'>{getAuthenticationTime()}</p>
            </div>
            <hr/>
        </div>
    )
}
