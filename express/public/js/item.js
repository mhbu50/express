frappe.ui.form.on('Item', {
	onload: function(frm) {
        cur_frm.fields_dict["addon"].grid.get_field("item").get_query = function(doc){
            return {
                    filters:{
                            "is_addon": true
                    }
            }
     }	 
  }
});
