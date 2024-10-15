--
-- The Kong entry point handler
--

local access = require "kong.plugins.oauth-proxy.access"

-- Runs after the CORS plugin which has priority 2000
-- https://docs.konghq.com/konnect/reference/plugins/
local TokenHandler = {
    PRIORITY = 1900,
    VERSION = "2.0.0",
}

function TokenHandler:access(conf)
    access.run(conf)
end

return TokenHandler
