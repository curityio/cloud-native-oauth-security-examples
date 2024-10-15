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

class UserInfoViewModel: ObservableObject {
    
    private let apiClient: ApiClient
    private let onLoggedOut: () -> Void
    @Published var userName: String?
    @Published var error: ApplicationError?
    
    init(apiClient: ApiClient, onLoggedOut: @escaping () -> Void) {
        
        self.apiClient = apiClient
        self.onLoggedOut = onLoggedOut
        self.userName = nil
        self.error = nil
    }
    
    func getUserInfo() {

        self.error = nil
        Task {
            do {
                
                let userInfo = try await self.apiClient.getUserInfo()
                await MainActor.run {
                    self.userName = "\(userInfo.givenName) \(userInfo.familyName)"
                }
    
            } catch {
                
                await MainActor.run {
                    
                    let applicationError = error as? ApplicationError
                    if applicationError?.code == "login_required" {
                        
                        // Handle session expiry by prompting the user to re-login
                        self.userName = nil
                        self.onLoggedOut()
                       
                    } else {

                        // Otherwise render the error
                        self.error = applicationError
                    }
                }
            }
        }
    }
    
    func clear() {
        self.userName = nil
        self.error = nil
    }
}
