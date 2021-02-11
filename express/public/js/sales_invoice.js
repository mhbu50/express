frappe.ui.form.on('Sales Invoice', {
    refresh(frm) {
        if (frm.doc.docstatus === 0) {
            frm.page.add_menu_item(__("Submit in Background"), function() {
                frappe.call('express.events.sales_invoice.submit', {doc: frm.doc.name})
                .then(r=> {
                    frappe.show_alert("Document is submitting in background");
                })
            });
        } else if (frm.doc.docstatus === 1) {
            frm.page.add_menu_item(__("Cancel in Background"), function() {
                frappe.call('express.events.sales_invoice.cancel', {doc: frm.doc.name})
                .then(r=> {
                    frappe.show_alert("Document is canceling in background");
                })
            });
        }
        
    }
})