from __future__ import unicode_literals

import frappe
import frappe.defaults
from frappe.utils import cstr, flt, fmt_money, formatdate, getdate
from frappe.utils import (cint, split_emails, get_request_site_address, cstr,get_files_path, get_backups_path, get_url, encode)
from frappe import _
from frappe.sessions import Session
from frappe.desk.doctype.desktop_icon.desktop_icon import get_user_copy
from frappe.desk.moduleview import get
import json


@frappe.whitelist()
def get_addon_list():
	return frappe.db.sql(""" select item as 'addon',parent as 'item_code',addon_order from tabAddon where parent is not null
	ORDER BY addon_order ASC""", as_dict=1),50

@frappe.whitelist()
def get_items_order():
	return frappe.db.sql(""" select item_code,pos_order_position from tabItem where pos_order_position != 0 order by pos_order_position ASC""", as_dict=1)

def on_session_creation(login_manager):
	info = frappe.db.get_value("User", frappe.local.session_obj.user,
			["home_page_link"], as_dict=1)

	frappe.local.response["home_page"] = info.home_page_link or "/desk"
