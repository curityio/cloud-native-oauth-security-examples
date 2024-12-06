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

struct UserInfoView: View {
    
    @ObservedObject private var model: UserInfoViewModel

    init(model: UserInfoViewModel) {
        self.model = model
    }
    
    var body: some View {
        
        VStack {
            
            let contentWidth = UIScreen.main.bounds.size.width * 0.8
            VStack {

                TextHeading(text: "userinfo_heading".localized(), width: contentWidth)
                TextParagraph(text: "userinfo_info".localized(), width: contentWidth)
                CustomButton(text: "userinfo_command".localized(), width: contentWidth, action: self.model.getUserInfo)

                if self.model.userName != nil {
                    let result = "userinfo_result".localizedFormat(self.model.userName!)
                    TextOnColor(text: result, width: contentWidth, color: CustomColors.paleGreen)
                }
                
                if self.model.error != nil {
                    TextOnColor(text: self.model.error!.toString(), width: contentWidth, color: Color.red)
                }

            }.padding(.bottom, 20)
        }
    }
}
