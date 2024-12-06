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

struct PageLoadView: View {

    private var loginStatus: String
    private var pageLoadError: String

    init (
        isPageLoaded: Bool,
        isLoggedIn: Bool,
        pageLoadError: ApplicationError?) {

        if (!isPageLoaded) {
            self.loginStatus = "status_loading".localized()
        }
        else if (isLoggedIn) {
            self.loginStatus = "status_authenticated".localized()
        } else {
            self.loginStatus = "status_unauthenticated".localized()
        }

        self.pageLoadError = pageLoadError?.toString() ?? ""
    }

    var body: some View {

        let contentWidth = UIScreen.main.bounds.size.width * 0.8
        return VStack {
            
            TextHeading(text: "page_load_heading".localized(), width: contentWidth)
            TextParagraph(text: "page_load_info".localized(), width: contentWidth)
            TextOnColor(text: self.loginStatus, width: contentWidth, color: CustomColors.paleGreen)
            
            if !self.pageLoadError.isEmpty {
                TextOnColor(text: self.pageLoadError, width: contentWidth, color: Color.red)
            }

        }.padding(.bottom, 20)
    }
}
