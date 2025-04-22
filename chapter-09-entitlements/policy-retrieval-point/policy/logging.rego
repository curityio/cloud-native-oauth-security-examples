package system.log

#
# Demonstrate adding token data to decision logs
#
claims := io.jwt.decode(input.input.accessToken)[1]
mask contains {"op": "upsert", "path": "/input/claims", "value": output} if {
    output := {
        "scope": claims.scope,
        "customer_id": claims.customer_id,
        "region": claims.region,
        "roles": claims.roles,
        "level_of_assurance": claims.level_of_assurance
    }
}

#
# Demonstrate erasing sensitive data from decision logs
#
mask contains "/input/accessToken"
