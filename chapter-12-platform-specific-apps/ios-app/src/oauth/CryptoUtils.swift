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
import CryptoKit

struct CryptoUtils {
    
    static func generateRandomString() -> String {
        
        let count = 32
        var bytes = [UInt8](repeating: 0, count: count)
        _ = SecRandomCopyBytes(kSecRandomDefault, count, &bytes)

        let data = Data(bytes: bytes, count: count)
        return urlEncode(base64: data.base64EncodedString())
    }
    
    static func generateHash(input: String) -> String {
        
        let bytes = SHA256.hash(data: input.data(using: .utf8)!)
        return urlEncode(base64: Data(bytes).base64EncodedString())
    }
    
    static func urlEncode(input: String) -> String {
        return input.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!
    }

    static private func urlEncode(base64: String) -> String {
        return base64
            .replacingOccurrences(of: "=", with: "")
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
    }
}
