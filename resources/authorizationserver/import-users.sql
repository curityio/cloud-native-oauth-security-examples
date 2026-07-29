/*
 * Import some backed up test users
 */
 
COPY accounts (account_id, username, email, phone, attributes, active, created, updated) FROM stdin;
59aa5d82-4191-4f79-ba92-3ecb5720a135	dana	dana@demo.example	01111	{"name": {"givenName": "Dana", "familyName": "Demo"}, "emails": [{"value": "dana@demo.example", "primary": true}], "customerId": "2099", "region": "USA", "roles": [{"value": "customer", "primary": true}], "agreeToTerms": "on", "phoneNumbers": [{"value": "01111", "primary": true}], "urn:se:curity:scim:2.0:Devices": []}	1	1713884200	1713884200
cdb976b0-08f9-4a10-8e31-5a5577697a61	kim	kim@demo.example	02222	{"name": {"givenName": "Kim", "familyName": "Test"}, "emails": [{"value": "kim@demo.example", "primary": true}], "customerId": "7791", "region": "USA", "roles": [{"value": "admin", "primary": true}], "agreeToTerms": "on", "phoneNumbers": [{"value": "02222", "primary": true}], "urn:se:curity:scim:2.0:Devices": []}	1	1713884223	1713884223
\.

COPY credentials (id, subject, password, attributes, created, updated) FROM stdin;
6a273e20-6015-4243-8117-44379cadf582	dana	$5$rounds=20000$Se4r2wzZVdc8Pd1s$5HMyJamk.Z7D8VuaV9kerY2ne3VDqf43XSZa6krRiFC	{}	2025-03-14 14:53:30.623009	2025-03-14 14:53:30.623009
79b6852c-8062-403b-b0a9-3b19d7175233	kim	$5$rounds=20000$gpwr9WiEHG7RxeRC$IH.QDBDcRK6WfTIp.Yeg7pL7ePEvDMHSwBP.irx0ym/	{}	2025-03-14 14:53:30.623009	2025-03-14 14:53:30.623009
