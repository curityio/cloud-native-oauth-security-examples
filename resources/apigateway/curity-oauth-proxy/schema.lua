--
-- The Kong schema definition
--

return {
    name = "oauth-proxy",
    fields = {{
        config = {
            type = "record",
            fields = {
                { cookie_name_prefix = { type = "string", required = true } },
                { encryption_key = { type = "string", required = true } }
            }
        }
    }}
}
