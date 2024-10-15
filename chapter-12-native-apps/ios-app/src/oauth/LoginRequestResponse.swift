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

import Foundation
import AuthenticationServices

class LoginRequestResponse: NSObject, ASWebAuthenticationPresentationContextProviding {
    
    private var authSession: ASWebAuthenticationSession?
    
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return ASPresentationAnchor()
    }

    func execute(authorizationRequestUrl: String, onComplete: @escaping (_: URL?, _: Error?) -> Void) throws {

        authSession = ASWebAuthenticationSession(
            url: URL(string: authorizationRequestUrl)!,
            callbackURLScheme: "com.example.demoapp",
            completionHandler: { (callbackUrl: URL?, error: Error?) in

                defer {
                    self.authSession?.cancel()
                    self.authSession = nil
                }
                
                onComplete(callbackUrl, error)
            }
        )
     
        authSession?.presentationContextProvider = self
        authSession?.start()
    }
}
