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

struct TextOnColor: View {

    private var text: String
    private var width: Double
    private var color: Color

    init (text: String, width: Double, color: Color) {
        self.text = text
        self.width = width
        self.color = color
    }

    var body: some View {

        return Text(self.text)
            .padding(10)
            .font(.system(size: 14))
            .frame(width: self.width, alignment: .leading)
            .background(self.color)
            .cornerRadius(3)
    }
}
