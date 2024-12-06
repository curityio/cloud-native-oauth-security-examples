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

import SwiftUI

class SignInViewModel: ObservableObject {
    
    private let oauthClient: OAuthClient
    private let loginRequestResponse: LoginRequestResponse
    private let onLoggedIn: () -> Void
    @Published var error: ApplicationError?
    
    init(oauthClient: OAuthClient, onLoggedIn: @escaping () -> Void) {
        
        self.oauthClient = oauthClient
        self.loginRequestResponse = LoginRequestResponse()
        self.onLoggedIn = onLoggedIn
        self.error = nil
    }
    
    /*
     * Start a login by opening the request URL in the ASWebAuthenticationSession window
     */
    func startLogin() {
        
        do {
            self.error = nil
            let authorizationRequestUrl = self.oauthClient.startLogin()
            try self.loginRequestResponse.execute(
                authorizationRequestUrl: authorizationRequestUrl,
                onComplete: self.endLogin)

        } catch {
            self.error = error as? ApplicationError
        }
    }

    /*
     * End a login by exchanging the authorization code for tokens
     */
    func endLogin(responseUrl: URL?, error: Error?) {

        self.error = nil
        Task {
            do {
                let completed = try await self.oauthClient.endLogin(responseUrl: responseUrl, error: error)
                if completed {
                    await MainActor.run {
                        self.onLoggedIn()
                    }
                }

            } catch {
                
                await MainActor.run {
                    self.error = error as? ApplicationError
                }
            }
        }
    }
}
