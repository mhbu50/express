import frappe
import json
from frappe.utils.background_jobs import enqueue


@frappe.whitelist()
def submit(doctype, docname):
    doc = frappe.get_doc(doctype, docname)
    enqueue(doc.submit, job_name="Submitting {} {}".format(doctype, docname), queue="long")


@frappe.whitelist()
def cancel(doctype, docname):
    doc = frappe.get_doc(doctype, docname)
    enqueue(doc.cancel, job_name="Cancelling {} {}".format(doctype, docname), queue="long")


@frappe.whitelist()
def submit_multiple(doctype, docs):
    docs = json.loads(docs)
    result = []
    flag = 0
    for row in docs:
        doc = frappe.get_doc(doctype, row["name"])
        if doc.docstatus != 0:
            result.append(doc.name)
        else:
            flag = 1
            enqueue(doc.submit, job_name="Submitting {} {}".format(doctype, doc.name), queue="long")
    result.append(flag)
    return result


@frappe.whitelist()
def cancel_multiple(doctype, docs):
    docs = json.loads(docs)
    result = []
    flag = 0
    for row in docs:
        doc = frappe.get_doc(doctype, row["name"])
        if doc.docstatus != 1:
            result.append(doc.name)
        else:
            flag = 1
            enqueue(doc.cancel, job_name="Cancelling {} {}".format(doctype, doc.name), queue="long")
    result.append(flag)
    return result
