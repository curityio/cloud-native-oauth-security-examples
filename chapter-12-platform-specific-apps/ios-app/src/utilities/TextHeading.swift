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

struct TextHeading: View {

    private var text: String
    private var width: Double
    private var fontSize: CGFloat

    init (text: String, width: Double, fontSize: CGFloat = 18) {
        self.text = text
        self.width = width
        self.fontSize = fontSize
    }

    var body: some View {

        return Text(self.text)
            .font(.system(size: fontSize))
            .fontWeight(.semibold)
            .frame(width: self.width, alignment: .leading)
            .padding(.bottom, 5)
    }
}
