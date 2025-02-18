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
import {IpcEventNames} from '../../shared/ipcEventNames';
import {getErrorText} from '../errorUtil';
import {ipcRequest} from '../ipcRequest';
import {SignInProps} from './signInProps';

export function SignInView(props: SignInProps) {

    const [isInProgress, setIsInProgress] = useState(false);
    const [errorText, setErrorText] = useState('');
    
    async function execute() {

        try {

            setErrorText('');
            setIsInProgress(true);
            
            // Call the main side of the app to initiate login processing
            // The React app receives a response containing ID token claims
            const claims = await ipcRequest(IpcEventNames.Login);
            
            // Bring the app back to the foreground
            await ipcRequest(IpcEventNames.Reactivate);

            // Notify the parent view
            props.onLoggedIn(claims);

        } catch (e: any) {
            
            setErrorText(getErrorText(e));

        } finally {

            setIsInProgress(false);
        }
    }

    return (

        <div className='container'>
            <h2>Sign In</h2>
            <p>Start a loopback HTTP server then open the system browser at the authorization request URL.</p>
            <button 
                id='signOut' 
                className='btn btn-primary operationButton'
                onClick={execute}>
                    Sign In
            </button>
            {isInProgress &&
            <div>
                <p className='alert alert-success'>Login in progress ...</p>
            </div>
            }
            {errorText &&
            <div>
                <p className='alert alert-danger' id='signInErrorResult'>{errorText}</p>
            </div>}
            <hr/>
        </div>
    )
}
