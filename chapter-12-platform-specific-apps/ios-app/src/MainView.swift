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

struct MainView: View {

    @ObservedObject private var model: MainViewModel

    init (model: MainViewModel) {
        self.model = model
    }
    
    var body: some View {

        ScrollView {
            VStack {
                TitleView()
                PageLoadView(
                    isPageLoaded: self.model.isInitialized,
                    isLoggedIn: self.model.isLoggedIn,
                    pageLoadError: self.model.error)
                
                if self.model.isInitialized {
                    
                    if !self.model.isLoggedIn {
                        SignInView(model: self.model.getSignInViewModel())
                    }
                    
                    if self.model.isLoggedIn {
                        
                        ClaimsView(claims: self.model.getIdTokenClaims())
                        CallApiView(model: self.model.getCallApiViewModel())
                        UserInfoView(model: self.model.getUserInfoViewModel())
                        SignOutView(onLoggedOut: self.model.onLoggedOut)
                    }
                }
                
                Spacer()
            }
        }
        .onAppear(perform: self.model.initialize)
    }
}
