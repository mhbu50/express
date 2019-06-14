from __future__ import unicode_literals

import frappe

@frappe.whitelist()
def get_addon_list():
	return frappe.db.sql("""select item as 'addon',parent as 'item_code',addon_order,price from tabAddon where parent is not null
	ORDER BY addon_order ASC""", as_dict=1)

@frappe.whitelist()
def get_items_order_and_printers(p_restaurant_menu=None):
	printers =[]
	if p_restaurant_menu is not None:
		restaurant_menu = frappe.get_doc("Restaurant Menu",p_restaurant_menu)
		for item in restaurant_menu.items:
			if item.printer:
				printers.append(item.printer)
		printers = list(set(printers))
	return frappe.db.sql(""" select item_code,pos_order_position from tabItem where pos_order_position != 0 order by pos_order_position ASC""", as_dict=1),printers

def on_session_creation(login_manager):
	info = frappe.db.get_value("User", frappe.local.session_obj.user,
			["home_page_link"], as_dict=1)

	frappe.local.response["home_page"] = info.home_page_link or "/desk"
