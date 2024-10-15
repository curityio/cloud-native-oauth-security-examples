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
import {UserInfoProps} from './userInfoProps';

export function UserInfoView(props: UserInfoProps) {

    const [userName, setUserName] = useState('');
    const [errorText, setErrorText] = useState('');

    async function execute() {
        
        try {

            let userInfo = await props.apiClient.getOAuthUserInfo();

            setErrorText('');
            if (userInfo.givenName && userInfo.familyName) {
                setUserName(`${userInfo.givenName} ${userInfo.familyName}`);
            } else {
                setUserName('No username details returned from the userinfo endpoint');
            }

        } catch (e: any) {

            if (e instanceof ApplicationError && e.isSessionExpiredError()) {
                props.onLoggedOut();
                return;
            }

            setUserName('');
            setErrorText(ErrorRenderer.toDisplayFormat(e));
        }
    }

    return (

        <div className='container'>
            <h2>User Info</h2>
            <p>The SPA sends its SameSite cookie to the OAuth Agent to get OpenID Connect User Info.</p>
            <button 
                id='getUserInfo' 
                className='btn btn-primary operationButton'
                onClick={execute}>
                    Get User Info
            </button>
            {userName &&
            <div>
                <p id='getUserInfoResult' className='alert alert-success'>{userName}</p>
            </div>}
            {errorText &&
            <div>
                <p className='alert alert-danger' id='getUserInfoErrorResult'>{errorText}</p>
            </div>}
            <hr/>
        </div>
    )
}
