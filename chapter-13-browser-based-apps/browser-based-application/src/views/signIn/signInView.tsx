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
import {ErrorRenderer} from '../../utilities/errorRenderer';
import {SignInProps} from './signInProps';

export function SignInView(props: SignInProps) {

    const [errorText, setErrorText] = useState('');

    /*
     * Get the login URL, store state if needed, then redirect
     */
    async function execute() {

        try {

            location.href = await props.oauthClient.startLogin();

        } catch (e: any) {

            setErrorText(ErrorRenderer.toDisplayFormat(e));
        }
    }

    return (
        <div className='container'>
            <h2>Sign In</h2>
            <p>The SPA asks the OAuth Agent for an Authorization Request URL, then manages its own redirect.</p>
            <div>
                <button 
                    id='startAuthentication' 
                    className='btn btn-primary operationButton'
                    onClick={execute}>
                        Sign In
                </button>
            </div>
            {errorText &&
            <div>
                <p className='alert alert-danger' id='getDataErrorResult'>{errorText}</p>
            </div>}
            <hr/>
        </div>
    )
}
