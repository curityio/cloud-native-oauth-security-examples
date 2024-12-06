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

import JOSESwift

struct IDTokenClaims {
    
    private let claims: Dictionary<String, AnyObject>
    
    init (claims: Dictionary<String, AnyObject>) {
        self.claims = claims
    }
    
    public func  getIssuer() -> String {
        return self.claims["iss"] as? String ?? ""
    }

    public func getAudience() -> [String] {
        
        if let audString = self.claims["aud"] as? String {
            return [audString]
        }
        
        if let audArray = self.claims["aud"] as? [String] {
            return audArray
        }

        return []
    }

    public func getExpiry() -> Int64 {
        return self.claims["exp"] as? Int64 ?? 0
    }
    
    public func getAuthTime() -> Int64 {

        if let authTime = self.claims["auth_time"] as? Int64 {
            return authTime
        }
        
        return 0
    }
}
