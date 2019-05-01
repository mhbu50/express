frappe.ui.form.on('Item', {
	setup: function(frm) {
        frm.fields_dict["addon"].grid.get_field("item").get_query = function(doc){
            return {
                    filters:{
                            "is_addon": true
                    }
            }
     }	 
  },
  add_from:function(frm){
        if(frm.doc.add_from != undefined || frm.doc.add_from != null){
        frappe.model.with_doc("Item", frm.doc.add_from, function() {
                var item= frappe.model.get_doc("Item", frm.doc.add_from);
                $.each(item.addon, function(index, row){
                    d = frm.add_child("addon");
                    d.item = row.item;
                    d.addon_order = row.addon_order;
                    frm.refresh_field("addon");
                });
            });
        }
  }
});
