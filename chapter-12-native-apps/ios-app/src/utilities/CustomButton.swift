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

struct CustomButton: View {

    private var text: String
    private var width: Double
    private var action: () -> Void

    init (text: String, width: Double, action: @escaping () -> Void) {
        self.text = text
        self.width = width
        self.action = action
    }

    var body: some View {
        
        Button(action: self.action) {

            return Text(self.text)
                .padding(5)
                .font(.system(size: 14))
                .frame(width: 200)
                .foregroundColor(Color.white)
                .background(CustomColors.lightBlue)
                .cornerRadius(3)

        }.frame(width: self.width, alignment: .leading)
    }
}
