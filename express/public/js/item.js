frappe.ui.form.on('Item', {
	onload: function(frm) {
        cur_frm.fields_dict["addon"].grid.get_field("item").get_query = function(doc){
            return {
                    filters:{
                            "is_addon": true
                    }
            }
     }	 
  },
  add_from:function(frm){
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
});
