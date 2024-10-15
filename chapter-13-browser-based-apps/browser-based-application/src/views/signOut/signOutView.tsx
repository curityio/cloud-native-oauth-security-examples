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

import React, {useState} from 'react';
import {ApplicationError} from '../../utilities/applicationError';
import {ErrorRenderer} from '../../utilities/errorRenderer';
import {SignOutProps} from './signOutProps';

export function SignOutView(props: SignOutProps) {

    const [errorText, setErrorText] = useState('');

    async function execute() {

        try {

            const url = await props.oauthClient.logout();
            props.onLoggedOut();
            location.href = url;

        } catch (e: any) {

            if (e instanceof ApplicationError && e.isSessionExpiredError()) {
                props.onLoggedOut();
                return;
            }

            setErrorText(ErrorRenderer.toDisplayFormat(e));
        }
    }

    return (
        <div className='container'>
            <h2>Sign Out</h2>
            <p>The SPA asks the OAuth Agent for an End Session Request URL, then manages its own redirect.</p>
            <button 
                id='signOut' 
                className='btn btn-primary operationButton'
                onClick={execute}>
                    Sign Out
            </button>
            {errorText &&
            <div>
                <p className='alert alert-danger' id='signOutErrorResult'>{errorText}</p>
            </div>}
            <hr/>
        </div>
    )
}
