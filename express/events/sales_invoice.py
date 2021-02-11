import frappe
from frappe.utils.background_jobs import enqueue

@frappe.whitelist()
def submit(doc):
    doc = frappe.get_doc('Sales Invoice', doc)
    enqueue(doc.submit, job_name= "Submitting Invoice {}".format(doc.name), queue="long")

@frappe.whitelist()
def cancel(doc):
    doc = frappe.get_doc('Sales Invoice', doc)
    enqueue(doc.cancel, job_name= "Cancelling Invoice {}".format(doc.name), queue="long")
