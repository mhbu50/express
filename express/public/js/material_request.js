


frappe.ui.form.on('Material Request Item', {
    item_code: function (frm, cdt, cdn) {  
        let row = frappe.get_doc(cdt, cdn)
        if (row.item_code){
            frappe.call('express.api.get_order_item_uom', {item_code: row.item_code})
            .then( r => {
                if (r.message){
                    row.uom = r.message.uom;
                    row.conversion_factor = r.message.conversion_factor;
                    frm.refresh_field('items')
                }
            })
        }
    },
    uom: function (frm, cdt, cdn) {  
        let row = frappe.get_doc(cdt, cdn)
        if (row.item_code){
            frappe.call('express.api.get_order_item_uom', {item_code: row.item_code})
            .then( r => {
                if (r.message){
                    row.uom = r.message.uom;
                    row.conversion_factor = r.message.conversion_factor;
                    frm.refresh_field('items')
                }
            })
        }
    }
})

// frappe.ui.form.off("Material Request Item", "qty")