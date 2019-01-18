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
	return frappe.db.sql(""" select name,parent,parentfield,addon_order from tabAddon where parent is not null ORDER BY addon_order ASC""", as_dict=1)

@frappe.whitelist()
def get_addons():
	addons = frappe.get_all('Addon', fields=['name', 'price'])
	result = ""
	for addon in addons:
		result = result + """<label class="checkbox-inline" style="padding: 0px 40px 40px 30px;    font-size: 18px;">
		<input class= "addons_add" style=" transform: scale(3) !important; margin-left: -26px;"
		 type="checkbox" data-price={} value="{}">{}</label>""".format(
			addon.price,addon.name,addon.name
			)
	return result

@frappe.whitelist()
def get_addon(addon):
	data = json.loads(addon)
	result = ""
	addons = frappe.get_all('Addon', fields=['name', 'price'])

	for addon in addons:
		if data['addon'] == addon.name:
			result = result + """<label class="checkbox-inline" style="padding: 0px 40px 40px 30px;    font-size: 18px;">
			<input class= "addons_add" style=" transform: scale(3) !important; margin-left: -26px;"
			type="checkbox" checked data-price={} value="{}">{}</label>""".format(
				data['price'],data['addon'],data['addon'])
		else:
			result = result + """<label class="checkbox-inline" style="padding: 0px 40px 40px 30px;     font-size: 18px;" >
			<input class= "addons_add" style=" transform: scale(3) !important; margin-left: -26px;"
			 type="checkbox" data-price={} value="{}">{}</label>""".format(
				addon.price,addon.name,addon.name
				)
	return result


@frappe.whitelist()
def get_rendered_addons(addons,item_code):
	if len(addons)>0:
		data = json.loads(addons)
		parent_template = ""
		result = ""
		addons_list = frappe.get_all('Addon', fields=['name', 'price'])
		cleand_addon = []
		for row in data:
			if row['parent_item'] == item_code:
				if len(cleand_addon)>0:
					if str(row['group_id']) in [str(idg['group_id']) for idg in cleand_addon]:
						for i ,idg in enumerate(cleand_addon):
							if (str(row['group_id']) == str(idg['group_id'])):
								cleand_addon[i]['addon'].append({
							    "name":row['addon'],"price":row["price"]
									})
					else:
						cleand_addon.append({
							"group_id":str(row['group_id']),
							"addon": [{
								"name":row['addon'],"price":row["price"]
								}],
							"parent_qty": row["parent_qty"],
							"parent_item": row["parent_item"]
							})
				else:
					cleand_addon.append({
						"group_id":str(row['group_id']),
					    "addon": [{
						    "name":row['addon'],"price":row["price"]
						    }],
						"parent_qty": row["parent_qty"],
						"parent_item": row["parent_item"]
						})
		for row in cleand_addon:
			addons_template=""
			x = [ doc_addon['name'] for doc_addon in row['addon']]

			for addon in addons_list:
				if addon['name'] in x:
					addons_template = addons_template + """<label class="checkbox-inline" style="padding: 0px 40px 40px 30px;font-size: 18px;">
					<input class= "addons_add" style=" transform: scale(3) !important; margin-left: -26px;"
					type="checkbox" checked data-price={} value="{}">{}</label>""".format(
						addon['price'],addon['name'],addon['name'])
				else:
					addons_template = addons_template + """<label class="checkbox-inline" style="padding: 0px 40px 40px 30px;font-size: 18px;">
					<input class= "addons_add" style=" transform: scale(3) !important; margin-left: -26px;"
					  type="checkbox" data-price={} value="{}">{}</label>""".format(
						addon['price'],addon['name'],addon['name']
						)

			parent_template = parent_template+""" 
						<div class="modal-body">
							<h3 class="collapsible-custom" data-value ={}>Total Number of Items{}</h3>
							<div class="items-for-addons" data-group-qty ={}>
							{}
							</div>
						</div>
						""".format(row['parent_qty'], row['parent_qty'],row['parent_qty'],addons_template)
		return parent_template

	else:
		return "something went wrong"
