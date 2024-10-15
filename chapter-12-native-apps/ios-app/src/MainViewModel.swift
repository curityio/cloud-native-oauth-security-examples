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

class MainViewModel: ObservableObject {

    private let apiClient: ApiClient
    private let oauthClient: OAuthClient
    private var signInViewModel: SignInViewModel?
    private var callApiViewModel: CallApiViewModel?
    private var userInfoViewModel: UserInfoViewModel?

    @Published var isInitialized: Bool
    @Published var isLoggedIn: Bool
    @Published var error: ApplicationError?
    
    init() {
        
        self.oauthClient = OAuthClient()
        self.apiClient = ApiClient(oauthClient: self.oauthClient)
        self.isInitialized = false
        self.isLoggedIn = false
        self.error = nil
    }

    func initialize() {
        
        Task {
            do {
                
                try await self.oauthClient.initialize()
                await MainActor.run {
                    self.isInitialized = true
                }
                
            } catch {
                
                await MainActor.run {
                    self.error = error as? ApplicationError
                }
            }
        }
    }
    
    func onLoggedIn() {
        self.isLoggedIn = true
    }

    func onLoggedOut() {
        self.oauthClient.logout()
        self.callApiViewModel?.clear()
        self.userInfoViewModel?.clear()
        self.isLoggedIn = false
        self.error = nil
    }
    
    func getIdTokenClaims() -> IDTokenClaims? {
        return self.oauthClient.idTokenClaims
    }
    
    func getSignInViewModel() -> SignInViewModel {

        if self.signInViewModel == nil {

            self.signInViewModel = SignInViewModel(
                oauthClient: self.oauthClient,
                onLoggedIn: self.onLoggedIn)
        }

        return self.signInViewModel!
    }
    
    func getCallApiViewModel() -> CallApiViewModel {

        if self.callApiViewModel == nil {

            self.callApiViewModel = CallApiViewModel(
                apiClient: self.apiClient,
                onLoggedOut: self.onLoggedOut)
        }

        return self.callApiViewModel!
    }
    
    func getUserInfoViewModel() -> UserInfoViewModel {

        if self.userInfoViewModel == nil {

            self.userInfoViewModel = UserInfoViewModel(
                apiClient: self.apiClient,
                onLoggedOut: self.onLoggedOut)
        }

        return self.userInfoViewModel!
    }
}
