--
--  Copyright 2024 Curity AB
--
--  Licensed under the Apache License, Version 2.0 (the "License");
--  you may not use this file except in compliance with the License.
--  You may obtain a copy of the License at
--
--      http://www.apache.org/licenses/LICENSE-2.0
--
--  Unless required by applicable law or agreed to in writing, software
--  distributed under the License is distributed on an "AS IS" BASIS,
--  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
--  See the License for the specific language governing permissions and
--  limitations under the License.
--

return {
    name = "phantom-token",
    fields = {{
        config = {
            type = "record",
            fields = {
                { introspection_endpoint = { type = "string", required = true } },
                { client_id = { type = "string", required = true } },
                { client_secret = { type = "string", required = true } },
                { token_cache_seconds = { type = "number", required = true, default = 300 } },
                { scope = { type = "string", required = false } },
                { verify_ssl = { type = "boolean", required = true, default = true } }
            }
        }}
    }
}
