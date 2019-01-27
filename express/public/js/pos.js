//prevent contextmenu
// document.addEventListener('contextmenu', event => event.preventDefault());

//prevent selection
// if (typeof document.onselectstart != "undefined") {
//   document.onselectstart = new Function("return false");
// } else {
//   document.onmousedown = new Function("return false");
//   document.onmouseup = new Function("return true");
// }

setTimeout(function() {
  $('[data-value ="All Item Groups"]').remove();
  $('[data-value ="Raw Material"]').remove();
  $('[data-value ="Sub Assemblies"]').remove();
  $('[data-value ="Consumable"]').remove();
  $('[data-value ="POS Items"]').remove();
  $('[data-value ="Stock Item"]').remove();
  $('[data-value ="Processed Raw Material"]').remove();
  $('[data-value ="اضافات - Additions To The Sandwich"]').remove();
  $('[data-value ="اضافات"]').remove();
}, 3000);


try {
  erpnext.pos.PointOfSale = erpnext.pos.PointOfSale.extend({});


  function send_kds(cart, pos_profile) {
    //get cart items
    frappe.call({
      method: 'express.api.send_cart_kds',
      args: {
        "cart": cart,
        // "pos_profile": me.frm.selected_doc.pos_profile
      },
      callback: function(r) {
        log("bb");
      }
    });
  }

	class PointOfSale extends erpnext.pos.PointOfSale {
    //for online moode
    submit_sales_invoice() {
      console.log("submit for online moode");
      console.log("this.frm.selected_doc.pos_profile = ", this.frm.selected_doc.pos_profile);
      var me = this;
      send_kds(me.frm.selected_doc, me.frm.selected_doc.pos_profile)
      super.submit_sales_invoice();
    }

    //for offline model
    print_dialog() {
      console.log("print_dialog offline moode");
      var me = this;
	    var html = frappe.render(me.print_template_data, me.frm.doc);
      if(cur_pos.pos_profile_data.print_after_submit){
        me.print_document(html);
        me.send_to_printers();
        me.make_new_cart();
        return;
      }
      this.msgprint = frappe.msgprint(
        `<a class="btn btn-primary print_doc"
          style="margin-right: 5px;">${__('Print')}</a>
        <a class="btn btn-default new_doc">${__('New')}</a>`);

      $('.print_doc').click(function () {
        for (var i = 0; i < cur_pos.pos_profile_data.invoice_copy; i++) {
          //nedd to change with jquery print lib
          me.print_document(html);
        }
        me.send_to_printers();
      })

      $('.new_doc').click(function () {
        me.msgprint.hide()
        me.make_new_cart()
      })
    }
         
    print_document(html){
      $('<iframe>', {
        name: 'myiframe',
        class: 'printFrame'
      })
      .appendTo('body')
      .contents().find('body')
      .append(html);

      window.frames['myiframe'].focus();
      window.frames['myiframe'].print();

      setTimeout(() => { $(".printFrame").remove(); }, 1000)   
    }         
         
    send_to_printers(){
      function uniques(arr,feild) {
        var a = [];
        for (var i=0, l=arr.length; i<l; i++)
            if (a.indexOf(arr[i][feild]) === -1 && arr[i][feild] !== '')
                a.push(arr[i][feild]);
        return a;
        }
      debugger;
      var me = this;
      var receipt = "";
      var order_receipt = "\nCollection Order\n\n Order:#" + me.frm.doc.order + "\n";
      var group_item_cart =  uniques(cur_pos.frm.doc.items,"item_group");
      // console.log("group_item_cart",group_item_cart);
      //get all group in items cart
      $.each(group_item_cart, function(index,group) {
        if(group == "اضافات - Additions To The Sandwich"){
          return;
        }
        //take group printer IP
        var ip = cur_pos.pos_profile_data.item_groups.find(x => x.item_group === group).printer;
        console.log("ip",ip);
        receipt = "\n\n\n\n" + group + "\n Order:#" + me.frm.doc.order + "\n";
        //filter items by group in cart
				var items_cart = $.grep(cur_pos.frm.doc.items, function(n,i){
          return n.item_group == group;
        });
        console.log("\n -----------------------------------------\ngroup",group);
        // console.log(" items_cart : " ,items_cart);
        //loop items_cart
        $.each(items_cart, function(index,ic) {
          // console.log("ic",ic.item_code);
          //check if it has addone
          var item_addons_num = cur_pos.frm.doc.addons.filter(function(value){
            return value.parent_item == ic.item_code;
          }).length ;
          // console.log("item_addons_num",item_addons_num);
          if(item_addons_num == 0){
          let qty = cur_pos.frm.doc.items.find(x => x.item_code === ic.item_code).qty;
          console.log("*******************************");
          console.log("Item = "+ ic.item_code +" Qty = " + qty);

          receipt += "*******************************\n";
          receipt += "Item = "+ ic.item_code +" Qty = " + qty+"\n";

          order_receipt += "*******************************\n";
          order_receipt += "Item = "+ ic.item_code +" Qty = " + qty+"\n";
          }
          //filter addons_table by item
          var item_addons = $.grep(cur_pos.frm.doc.addons, function(n,i){
          return n.parent_item == ic.item_code;
          });
          // console.log("item_addon",item_addons);

          //get uniques parents_item from addons
          var unique_gruop = uniques(item_addons,"group_id");
          // console.log("unique_gruop",unique_gruop);

          $.each(unique_gruop ,function(index,g) {
            // console.log("g",g);
            //filter by group_id
            var by_group = item_addons.filter(function(value){
              return value.group_id == g;
                });

            // console.log("by_group",by_group);
            console.log("*******************************");
            console.log("Item = "+ ic.item_code +" Qty = "+ by_group[0].parent_qty);
            console.log("*******************************");

            receipt += "*******************************\n";
            receipt += "Item = "+ ic.item_code +" Qty = "+ by_group[0].parent_qty +"\n";
            receipt += "*******************************\n";

            order_receipt += "*******************************\n";
            order_receipt += "Item = "+ ic.item_code +" Qty = "+ by_group[0].parent_qty +"\n";
            order_receipt += "*******************************\n";

            $.each(by_group ,function(index,bg) {
              // console.log("\t\taddon: ",bg.addon.split("-")[1].trim());
              console.log("\tAddon: ",bg.addon.split("-")[1].trim() );

              receipt += "\tAddon: "+ bg.addon.split("-")[1].trim() + "\n";
              order_receipt += "\tAddon: "+ bg.addon.split("-")[1].trim() + "\n";
            });
          });
        });
        send_to_printer(ip,receipt);
      });
      //send complete order to order receipt printer
      if(cur_pos.pos_profile_data.printer_ip){
        console.log("order_receipt",order_receipt);
        send_to_printer(cur_pos.pos_profile_data.printer_ip,order_receipt);
      }

      //send to remote local printer
      function send_to_printer(ip,receipt) {
        var builder = new epson.ePOSBuilder();
        builder.addLayout(builder.LAYOUT_RECEIPT, 580);
        builder.addTextLang('en').addTextSmooth(true);

        // append message
        builder.addTextStyle(false, false, true);
        builder.addText(receipt+'\n');
        builder.addTextStyle(false, false, false);
        builder.addFeedUnit(16);

        // append paper cutting
        builder.addCut();

        var url = 'http://' + ip + '/cgi-bin/epos/service.cgi?devid=local_printer&timeout=60000';
        var epos = new epson.ePOSPrint(url);

        // register callback function
        epos.onreceive = function (res) {
            // close print dialog
            console.log("Order Sent");
            // print failure
            if (!res.success) {
                // show error message
                console.log("Show error message");
            }
        }

        // register callback function
        epos.onerror = function (err) {
            // show error message
            console.log("onerror");
        }

        epos.send(builder.toString());

        //destroy class instance
        epos = null;
        builder = null;
      }
    }

    create_new(){
      super.create_new();
      try {
        var str_order = localStorage.getItem("order");
        var date = localStorage.getItem("date");
        //get a numeric value from str_order, put it in order
        if ((str_order == null || str_order == "null") || 
        (date == null || date != moment().format('MM D, YYYY')) ){
          var order = 0;
          var date = moment().format('MM D, YYYY');
        } else {
          order = parseInt(str_order);
        }
        //increment order
        order++;
        this.frm.doc.order = order;
        this.frm.doc.phone = cur_pos.pos_profile_data.phone;
        //store values
        localStorage.setItem("order", order);
        localStorage.setItem("date", date);
      } catch (e) {
        console.log("e",e);
        
        frappe.throw(__("LocalStorage is full , did not save order or date"))
      }
    }

    onload(){
      super.onload();
      var me = this;
      frappe.call({
        method: "express.api.get_addon_list",
        freeze: true,
        callback: function (r) {
          console.log("get_data_from_server");     
          var addon_list = r.message;
          console.log("addon_list",addon_list);
          
          localStorage.setItem('addon_list', JSON.stringify(addon_list));   	
          me.addon_list = addon_list;	 
        }
      });
      console.log("onload this",this);
      if(localStorage.getItem("addon_list") !== "undefined"){
      this.addon_list =  JSON.parse(localStorage.getItem("addon_list"));
      }
    }

    make_control (){
      super.make_control();
      console.log("make_control this");
      var me = this;
      frappe.call({
        method: "express.api.get_items_order",
        freeze: true,
        callback: function (r) {
  
          var items_order = r.message;
          console.log("items_order",items_order);
          
          localStorage.setItem('items_order', JSON.stringify(items_order));   	
          me.items_order = items_order;	 
        }
      });
      if(localStorage.getItem("items_order") !== "undefined"){
      this.items_order =  JSON.parse(localStorage.getItem("items_order"));
      }      
    }

    add_to_cart(){
      super.add_to_cart();
      if(cur_pos.frm.doc.addons.length >0 && 
        cur_pos.frm.doc.addons.findIndex(p => p.parent_item == this.items[0].name && p.addon == "قياسي - Standard") > 0){      
      var addon_item_index = cur_pos.frm.doc.addons.findIndex(p => p.parent_item == this.items[0].name && p.addon == "قياسي - Standard");
      console.log("addon_item_index",addon_item_index);      
      cur_pos.frm.doc.addons[addon_item_index].parent_qty = parseInt(cur_pos.frm.doc.addons[addon_item_index].parent_qty) +1;  
      cur_pos.rerender_pos_bill_item_new();          
      }
    }

    get_sorted_item_groups(){
      let list = [];
      $.each(cur_pos.pos_profile_data.item_groups, function(i, data) {       
        list[i] = { "item_group":data.item_group,"image":data.image};
      });
      return list;
    }
    make_search(){
      super.make_search();
      sorted_item_groups = this.get_sorted_item_groups()
      let item_groups_html = sorted_item_groups.map(function(data) {
      return "<button style='padding: 2px 5px; margin: 2px; font-weight: bold; content: ''; width: 16px; height: 16px; display: inline-block; margin-right: 5px; vertical-align: text-top; background-color: transparent; background-position : center center; background-repeat:no-repeat; background-image : url(" + data.image + ");' class='btn' data-value='" + data.item_group+"'>" + data.item_group + "</button>";      
      }).join("");      
      this.search_item_group.find('.row').html(item_groups_html);
    }
  }
  erpnext.pos.PointOfSale = PointOfSale;


} catch (e) {
  console.log("error", e);
}
