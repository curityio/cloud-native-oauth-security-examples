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
import {ErrorRenderer} from '../../utilities/errorRenderer';
import {MultiTabLogout} from '../../utilities/multiTabLogout';
import {CallApiView} from '../callApi/callApiView';
import {ClaimsView} from '../claims/claimsView';
import {MultiTabView} from '../multiTab/multiTabView';
import {PageLoadView} from '../pageLoad/pageLoadView';
import {SignInView} from '../signIn/signInView';
import {SignOutView} from '../signOut/signOutView';
import {TitleView} from '../title/titleView';
import {UserInfoView} from '../userInfo/userInfoView';
import {AppProps} from './appProps';

export default function App(props: AppProps) {

    const [isPageLoaded, setIsPageLoaded] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [pageLoadError, setPageLoadError] = useState('');
    const multiTabLogout = new MultiTabLogout(() => onExternalLogout());

    useEffect(() => {
        startup();
        return () => cleanup();
    }, []);

    /*
     * The SPA downloads configuration, then calls the OAuth agent to see if logged in or to handle login responses
     */
    async function startup() {

        window.addEventListener('storage', multiTabLogout.listenForLoggedOutEvent);
        multiTabLogout.initialize();

        try {
            await props.viewModel.loadConfiguration();
            await props.viewModel.handlePageLoad();

            setIsPageLoaded(true);
            setIsLoggedIn(props.viewModel.pageLoadResponse!.isLoggedIn);

        } catch (e: any) {

            setPageLoadError(ErrorRenderer.toDisplayFormat(e));
        }
    }

    /*
     * Free resources when the view unloads
     */
    function cleanup() {
        window.removeEventListener('storage', multiTabLogout.listenForLoggedOutEvent);
    }

    /*
     * When the user logs out, the SPA raises an event to other browser tabs
     */
    function onLoggedOut() {

        setIsLoggedIn(false);
        multiTabLogout.raiseLoggedOutEvent();
    }

    /*
     * This browser tab is notified when logout occurs on another tab, then cleans up this tab's state
     */
    function onExternalLogout() {
        onLoggedOut();
    }

    /*
     * This simple app does not use React navigation and just renders the current view based on state
     */
    return (
        <>
            <TitleView />
            <PageLoadView
                isPageLoaded = {isPageLoaded}
                isLoggedIn = {isLoggedIn}
                pageLoadError = {pageLoadError} />

            {isPageLoaded &&
                <>

                    {/* Unauthenticated views */}
                    {!isLoggedIn &&
                        <SignInView 
                            oauthClient={props.viewModel.oauthClient!} />
                    }

                    {/* Authenticated views */}
                    {isLoggedIn &&
                        <>
                            <ClaimsView 
                                claims={props.viewModel.pageLoadResponse?.claims} />

                            <CallApiView 
                                apiClient={props.viewModel.apiClient!}
                                onLoggedOut={() => onLoggedOut()} />

                            <UserInfoView 
                                apiClient={props.viewModel.apiClient!}
                                onLoggedOut={() => onLoggedOut()} />

                            <MultiTabView />

                            <SignOutView 
                                oauthClient={props.viewModel.oauthClient!}
                                onLoggedOut={() => onLoggedOut()} />
                        </>
                    }
                </>
            }
        </>
    );
}
