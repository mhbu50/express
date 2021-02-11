import frappe
from frappe.utils.background_jobs import enqueue

@frappe.whitelist()
def submit(doctype, docname):
    doc = frappe.get_doc(doctype, docname)
    enqueue(doc.submit, job_name= "Submitting {}".format(doc.name), queue="long")

@frappe.whitelist()
def cancel(doctype, docname):
    doc = frappe.get_doc(doctype, docname)
    enqueue(doc.cancel, job_name= "Cancelling {}".format(doc.name), queue="long")
