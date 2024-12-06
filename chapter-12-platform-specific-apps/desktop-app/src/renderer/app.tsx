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

import React, {useEffect, useState} from 'react';
import {IpcEventNames} from '../shared/ipcEventNames';
import {CallApiView} from './callApi/callApiView';
import {ClaimsView} from './claims/claimsView';
import {getErrorText} from './errorUtil';
import {ipcRequest} from './ipcRequest';
import {PageLoadView} from './pageLoad/pageLoadView';
import {SignInView} from './signIn/signInView';
import {SignOutView} from './signOut/signOutView';
import {TitleView} from './title/titleView';
import {UserInfoView} from './userInfo/userInfoView';

/*
 * The React app
 */
export function App(): JSX.Element {

    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [idTokenClaims, setIdTokenClaims] = useState<any>(null);
    const [pageLoadError, setPageLoadError] = useState('');

    useEffect(() => {
        initialize();
    }, []);

    /*
     * Get the authentication status from the main side of the app
     */
    async function initialize() {

        try {
            const data = await ipcRequest(IpcEventNames.Initialize);
            setIsInitialized(true);
            setIsLoggedIn(data.isLoggedIn);

        } catch (e: any) {
            setPageLoadError(getErrorText(e));
        }
    }

    function onLoggedIn(claims: any) {
       setIsLoggedIn(true);
        setIdTokenClaims(claims);
    }

    function onLoggedOut() {
        setIsLoggedIn(false);
        setIdTokenClaims(null);
    }

    return (
        <>
            <TitleView />
            <PageLoadView
                isPageLoaded = {isInitialized}
                isLoggedIn = {isLoggedIn}
                pageLoadError = {pageLoadError} />

            {isInitialized &&
                <>

                    {!isLoggedIn &&
                        <SignInView
                            onLoggedIn={onLoggedIn} />
                    }

                    {isLoggedIn &&

                        <>
                            <ClaimsView
                                claims={idTokenClaims} />

                            <CallApiView 
                                onLoggedOut={onLoggedOut} />
                            
                            <UserInfoView
                                onLoggedOut={onLoggedOut} />

                            <SignOutView
                                onLoggedOut={onLoggedOut} />
                        </>
                    }
                </>
            }
        </>
    );
}
