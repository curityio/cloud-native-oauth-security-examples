#
#  Copyright 2024 Curity AB
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

package orders

#
# Import volatile business permissions that map to the role in the access token
# (business permissions are not part of the access token)
#
import data.permissions

#
# By default, deny access to all secured resources
#
default allow["allowed"] := false

#
# Parse claims from the JWT access token
#
claims := io.jwt.decode(input.accessToken)[1]

#
# Allow users to view individual order details if they are authorized
#
allow["allowed"] := can_view_order_details if {
	wants_to_view_order_details
}

#
# Allow users to list orders if they are authorized
#
allow["allowed"] := can_list_orders if {
	wants_to_list_orders
}

#
# When a user is authorized to access a list, return a condition to limit the items within that list
#
allow["condition"] := condition if {
	allow.allowed
	wants_to_list_orders
}

#
# Read input attributes to determine whether the user is trying to view an individual order
#
wants_to_view_order_details if {
	input.action == "view"
	input.type == "order"
}

#
# Read input attributes to determine whether the user is trying to list a collection of orders
#
wants_to_list_orders if {
	input.action == "list"
	input.type == "order"
}

#
# Use a logical OR to represent the conditions that allow a user to access an individual order's details
# See https://www.openpolicyagent.org/docs/latest/policy-language/#incremental-definitions
#
can_view_order_details if can_view_owned_order_details

can_view_order_details if can_view_regional_order_details

#
# Users (e.g. customers), who have the permission to own orders, can view an order if they own it
#
can_view_owned_order_details if {
	has_permission_to_own_orders
	claims.customer_id == input.order.customerId
}

#
# Users (e.g. administrators), who have the permission to list orders for a region,
# can view an order if they have logged in securely and if that order is in their region
#
can_view_regional_order_details if {
	has_permission_to_list_regional_orders
	claims.level_of_assurance == 2
	claims.region == input.order.region
}

#
# Users can list their orders 
# - if they can own orders and 
# - there is a customer ID in the condition
#
can_list_orders if {
	has_permission_to_own_orders
	condition.customerId
}

#
# Users can list orders for their region if
# - they have the permission,
# - logged in securely and
# - there is a region in the condition
#
can_list_orders if {
	has_permission_to_list_regional_orders
	claims.level_of_assurance >= 2
	condition.region
}

#
# Return an output condition that allows users who can own orders (e.g. customers) to access all of their own orders
#
condition["customerId"] := claims.customer_id if {
	has_permission_to_own_orders
}

#
# Return an output condition that allows users who can list orders for a region (e.g. admins) to access all orders for their region
#
condition["region"] := claims.region if {
	has_permission_to_list_regional_orders
}

#
# Check whether user is allowed to own orders
#
has_permission_to_own_orders if {
	matching_roles := {i | permissions[claims.roles[i]].canOwnOrders}
	count(matching_roles) > 0
}

#
# Check whether user is allowed to list orders for a region
#
has_permission_to_list_regional_orders if {
	matching_roles := {i | permissions[claims.roles[i]].canListOrdersForRegionalUsers}
	count(matching_roles) > 0
}
