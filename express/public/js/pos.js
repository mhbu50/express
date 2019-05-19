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
  $('[data-value ="اضافات - Additions To The Sandwich"]').remove();
  $('[data-value ="اضافات"]').remove();
}, 3000);


try {
  erpnext.pos.PointOfSale = erpnext.pos.PointOfSale.extend({});

	class PointOfSale extends erpnext.pos.PointOfSale {
    //for offline model
    print_document(html,printer){
      console.log("html",html);
     printer = "PDF";//for test
     cur_pos.webprint.printHtml(html,printer);
    }

    print_cashier(html) {
      var invoice_copy = 1;
      if(cur_pos.pos_profile_data.invoice_copy && cur_pos.pos_profile_data.invoice_copy > 1){
        invoice_copy = cur_pos.pos_profile_data.invoice_copy;
       }
       for (var i = 0; i < invoice_copy; i++) {
         this.print_document(html,cur_pos.pos_profile_data.cashier_printer);
       }
     }

    print_dialog() {
      console.log("print_dialog offline moode");
      var me = this;
      var html = frappe.render(me.print_template_data, me.frm.doc);
      if(cur_pos.pos_profile_data.print_after_submit){
        me.print_cashier(html);
        me.send_to_printers();
        me.make_new_cart();
        return;
      }

      this.msgprint = frappe.msgprint(
        `<a class="btn btn-primary print_doc"
          style="margin-right: 5px;">${__('Print')}</a>
        <a class="btn btn-default new_doc">${__('New')}</a>`);

      $('.print_doc').click(function () {
        me.print_cashier();
      });

      $('.new_doc').click(function () {
        me.msgprint.hide()
        me.make_new_cart()
      });
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
      this.webprint = new WebPrint(true, {
        relayHost: "127.0.0.1",
        relayPort: "8080"
       });
      var me = this;
      console.log("me",me);
      frappe.call({
        method: "express.api.get_addon_list",
        freeze: true,
        callback: function (r) {
          console.log("get_data_from_server");
          var addon_list = r.message;
          console.log("r.message",r.message);
          localStorage.setItem('addon_list', JSON.stringify(addon_list));
          me.addon_list = addon_list;
        }
      });
      console.log("onload this",this);
      if(localStorage.getItem("addon_list") !== "undefined"){
      this.addon_list =  JSON.parse(localStorage.getItem("addon_list"));
      }
    }

    send_to_printers(){
      //debugger;
    function uniques(arr,feild) {
      var a = [];
      for (var i=0, l=arr.length; i<l; i++)
          if (a.indexOf(arr[i][feild]) === -1 && arr[i][feild] !== '')
              a.push(arr[i][feild]);
      return a;
      }

      var me = this;
      var receipt = "\n\n\n\nOrder:#" + me.frm.doc.order + "\n";
      var receipt_html = "<html><body><table border='1'><tr><td colspan='2'>Order:#" + me.frm.doc.order + "</td></tr>";
      var order_receipt = "\nCollection Order\n\n Order:#" + me.frm.doc.order + "\n";
      var order_receipt_table = "<html><body><table border='1'><tr><td colspan='2'>Collection Order</td></tr>";
      order_receipt_table += "<tr><td colspan='2'>Order:#" + me.frm.doc.order + "</td></tr>";

      let to_print={};

      for (var printer of cur_pos.printer_list) {
        to_print[printer] = [];
      }
      //loop items_cart
      $.each(cur_pos.frm.doc.items, function(index,ic) {
        debugger;
        //filter addons_table by item
        var item_addons = $.grep(cur_pos.frm.doc.addons, function(n,i){
        return n.parent_item == ic.item_code;
        });

        to_print[ic.printer].push({"item_code":ic.item_code,"qty":ic.qty,"addons":item_addons});
      });

      //loop to send to_print to printers
      //cur_pos.webprint.printHtml(order_receipt_table, "PDF");      

      //send complete order to order receipt printer
      if(cur_pos.pos_profile_data.collection_orders_printer){
        console.log("order_receipt",order_receipt);
        cur_pos.webprint.printHtml(order_receipt,cur_pos.pos_profile_data.collection_orders_printer);
      }
      console.log("to_print",to_print);
    }

    make_control (){
      super.make_control();
      console.log("make_control this");
      var me = this;
      console.log("me.pos_profile_data.restaurant_menu",me.pos_profile_data.restaurant_menu);
      frappe.call({
        method: "express.api.get_items_order_and_printers",
        args: {
    			p_restaurant_menu:  me.pos_profile_data.restaurant_menu
    		},
        freeze: true,
        callback: function (r) {

          var items_order = r.message[0];
          me.printer_list = r.message[1].filter(Boolean);
          console.log("items_order",items_order);
          localStorage.setItem('items_order', JSON.stringify(items_order));
          me.items_order = items_order;
        }
      });
      if(localStorage.getItem("items_order") !== "undefined"){
      this.items_order =  JSON.parse(localStorage.getItem("items_order"));
      }

      $(me.wrapper).on("click", ".pos-item-wrapper", function () {
          if(cur_pos.frm.doc.docstatus == 0 && cur_pos.frm.doc.addons.length > 0 &&
            cur_pos.frm.doc.addons.findIndex(p => p.parent_item == cur_pos.items[0].name && p.addon == "قياسي - Standard") > 0){
          var addon_item_index = cur_pos.frm.doc.addons.findIndex(p => p.parent_item == cur_pos.items[0].name && p.addon == "قياسي - Standard");
          console.log("addon_item_index",addon_item_index);
          cur_pos.frm.doc.addons[addon_item_index].parent_qty = parseInt(cur_pos.frm.doc.addons[addon_item_index].parent_qty) +1;
          cur_pos.rerender_pos_bill_item_new();
          }
      });

      $(me.numeric_keypad).find('.numeric-del').click(function(){
  			if(cur_pos.numeric_id) {
  			} else {
  				cur_pos.frm.doc.addons = cur_pos.frm.doc.addons.filter(function(f){
            return f.parent_item != cur_pos.items[0].name;
          })
  			}
  		});
    }

    add_new_item_to_grid() {
      super.add_new_item_to_grid();
  		var me = this;
  		this.child.printer = this.items[0].printer;
  	}

    make_search(){
      super.make_search();
      sorted_item_groups = this.get_sorted_item_groups();
      let item_groups_html = sorted_item_groups.map(function(data) {

        return `<button class='button' data-value= '${data}' style='text-align: center; text-decoration: none; display: inline-block;
         font-weight: bold; margin: 4px 2px; cursor: pointer;'>
         <span style='background: url(${data.image}) no-repeat;float: left;
          width: 32px; height: 32px; margin-right: 10px'></span>${data}</button>`

        // return "<button style='padding: 2px 5px; margin: 2px; font-weight: bold;  content: \"\" ; display: inline-block; margin-right: 5px; vertical-align: text-top; background-color: transparent; background-position : center center; background-repeat:no-repeat; background-image : url(" + data.image + "); class='btn' data-value='" + data.item_group+"'>" + data.item_group + "</button>";
      }).join("");
      //this.search_item_group.find('.row').html(item_groups_html);
	this.search_item_group.parent().html(item_groups_html);
      var me = this;
      //this.search_item_group.on('click', '.row button', function() {
	$(".pos-bill-header").on('click', 'button', function() {
        console.log("on('click')");

        me.selected_item_group = $(this).attr('data-value');
        $('.row button').removeClass("item-active");
        $(this).addClass("item-active");

        me.page_len = 20;
        me.items = me.get_items();
        me.make_item_list();
      })
    }

    render_selected_item(){
      super.render_selected_item();
      $(".pos-selected-item-action").prepend('<button type="button" id="addons" class="btn btn-primary" data-toggle="modal" data-target="#exampleModalCenter">Modifier</button>');

      $("#addons").click(function() {
        var remain = $("#remain").text();
        $(".numbers_dialog").each(function(i) {
            if ($(this)[0].innerHTML > remain) {
                $(this)[0].disabled = true;
            	$(this).css("background-color", "red");
            }else{
            	$(this).css("background-color", "green");
            }
        });
    });

    frappe.require('assets/express/js/jquery.numpad.js', function() {
    $.fn.numpad.defaults.gridTpl = `<table class="table modal-content"></table>`;
    $.fn.numpad.defaults.backgroundTpl = `<div class="modal-backdrop in"></div>`;
    $.fn.numpad.defaults.displayTpl = `<input type="text" class="form-control" />`;
    $.fn.numpad.defaults.buttonNumberTpl =  `<button type="button" class="btn btn-default"></button>`;
    $.fn.numpad.defaults.buttonFunctionTpl = `<button type="button" class="btn" style="width: 100%;"></button>`;
    $.fn.numpad.defaults.onKeypadCreate = function(){$(this).find(".done").addClass("btn-primary");};

    $("#text-basic").numpad({
        onKeypadOpen:function(){
            var keypad = $(this);
            keypad.find(".done").click(function(e){
                var qty = keypad.find(".nmpd-display").val();
                var remain = parseInt($("#remain").text()) - parseInt(qty);
                var valueForSelectedItem = qty;
                if (remain < 0) {
                    frappe.msgprint("Quantity will be negative");
                    $("#text-basic").val("#");

                } else {
                $("#remain").text(remain);
                var addons = cur_pos.item_data.filter(obj => {
                  return obj.item_group === "اضافات - Additions To The Sandwich"
                });

                var result = "";
                for (var addon in addons){
                  result = result +
                  `<label class="checkbox-inline" style="padding: 0px 40px 40px 30px;font-size: 18px;">
            <input class= "addons_add" style=" transform: scale(3) !important; margin-left: -26px;"
            type="checkbox" value="${addons[addon].name}">${addons[addon].name}</label>`;
                };
                var addons_template = ` <div class="modal-body">
                <a  class="collapsible-custom" style="display: flex;margin-bottom: 20px;" onclick="cur_pos.hide_section(this)" row">
                <h3 class="col-xs-10" data-value = ${valueForSelectedItem}>
                Total Number of Items ${valueForSelectedItem}
                </h3>
                <span style="margin-block-start: 2em;" class="col-xs-2 glyphicon glyphicon-chevron-up pointer" aria-hidden="true" data-toggle="collapse" data-target="#content"></span>
                </a>
                <div class="items-for-addons" data-group-qty=${valueForSelectedItem}>
                    ${result}
                </div>
                </div>
                `;
                $("#new_nump_addons").prepend(addons_template);
                $("#text-basic").val("#");
                }
            });
        }
    });
  });

    $("#addons").click(function() {
        var remain = $("#remain").text();
        $(".numbers_dialog").each(function(i) {
            if ($(this)[0].innerHTML > remain) {
                $(this)[0].disabled = true;
            	$(this).css("background-color", "red");
            }else{
            	$(this).css("background-color", "green");
            }
        });
    });
    var item_code = $("#new_nump_addons").attr("data-parent-item");
    var addons = cur_pos.frm.doc.addons;
    var call_api = false;
    if (addons.length > 0) {
        for (var x in addons) {
            if (addons[x].parent_item) {
                if (item_code == addons[x].parent_item) {
                    call_api = true;
                };
            };
        };
    };

    if (call_api) {
        var addons_template =cur_pos.get_rendered_addons(addons,item_code);
        $("#new_nump_addons").prepend(addons_template);
        var total = 0;
        $("#new_nump_addons").find("h3").each(function(i) {
            total = total + parseInt($(this).attr("data-value"));
        });
        var remain = parseInt($("#remain").text()) - total;
        $("#remain").text(remain);
        $(".numbers_dialog").each(function(i) {
            if ($(this)[0].innerHTML > remain) {
                $(this)[0].disabled = true;
            	$(this).css("background-color", "red");
            }else{
            	$(this).css("background-color", "green");
            }
        });

    }

    $(".numbers_dialog").click(function() {
        var remain = parseInt($("#remain").text()) - parseInt(this.innerHTML);
        var valueForSelectedItem = this.innerHTML;
        if (remain < 0) {
            frappe.msgprint(__("Quantity will be negative"));
        } else {
		$("#remain").text(remain);
		var addons ;
		var item_parent = $("#new_nump_addons").attr("data-parent-item");
		var x_addons = cur_pos.addon_list.filter(obj => {
			return obj.item_code === item_parent
		  });
		if(x_addons.length <= 0){
			var y_addons = cur_pos.item_data.filter(obj => {
				return obj.item_group === "اضافات - Additions To The Sandwich"
			  });
			addons = y_addons;
		}else{
        	console.log("x_addons",x_addons);
			x_addons = x_addons.map(function (obj) {
				return {
					 name: obj.addon,
					 addon_order: obj.addon_order
				 };
			 });
			x_addons = x_addons.sort(function(a, b){
				return a.addon_order-b.addon_order
			});
			addons = x_addons;
		}

        var result = "";
        for (var addon in addons){
            result = result +
            `<label class="checkbox-inline" style="padding: 0px 40px 40px 30px;font-size: 18px;">
            <input class= "addons_add" style=" transform: scale(3) !important; margin-left: -26px;"
            type="checkbox" value="${addons[addon].name}">${addons[addon].name}</label>`;

            // `<label style='padding: 0px 40px 40px 30px;font-size: 18px;'>
            //   <input type='hidden' name='alarm' value='False'/>
            //   <input class='custom-checkbox-input' name='alarm' value='${addons[addon].name}' type='checkbox'>
            //   <span class='custom-checkbox-text'>${addons[addon].name}</span>
            // </label>`;

            // result = result +
            // `<span class="button-checkbox">
            // <button type="button" class="btn" data-color="primary">${addons[addon].name}</button>
            // <input type="checkbox"  value="${addons[addon].name} class="hidden"/>
            // </span>`
        };

        var addons_template = ` <div class="modal-body">
        <a  class="collapsible-custom" style="display: flex;margin-bottom: 20px;" onclick="cur_pos.hide_section(this)" row">
        <h3 class="col-xs-10" data-value = ${valueForSelectedItem}>
        Total Number of Items ${valueForSelectedItem}
        </h3>
        <span style="margin-block-start: 2em;" class="col-xs-2 glyphicon glyphicon-chevron-up pointer" aria-hidden="true" data-toggle="collapse" data-target="#content"></span>
        </a>
        <div class="items-for-addons" data-group-qty=${valueForSelectedItem}>
            ${result}
        </div>
        </div>
        `;
        $("#new_nump_addons").prepend(addons_template);

        $('.button-checkbox').each(function () {

          // Settings
          var $widget = $(this),
              $button = $widget.find('button'),
              $checkbox = $widget.find('input:checkbox'),
              color = $button.data('color'),
              settings = {
                  on: {
                      icon: 'glyphicon glyphicon-check'
                  },
                  off: {
                      icon: 'glyphicon glyphicon-unchecked'
                  }
              };

          // Event Handlers
          $button.on('click', function () {
              $checkbox.prop('checked', !$checkbox.is(':checked'));
              $checkbox.triggerHandler('change');
              updateDisplay();
          });
          $checkbox.on('change', function () {
              updateDisplay();
          });

          // Actions
          function updateDisplay() {
              var isChecked = $checkbox.is(':checked');

              // Set the button's state
              $button.data('state', (isChecked) ? "on" : "off");

              // Set the button's icon
              $button.find('.state-icon')
                  .removeClass()
                  .addClass('state-icon ' + settings[$button.data('state')].icon);

              // Update the button's color
              if (isChecked) {
                  $button
                      .removeClass('btn-default')
                      .addClass('btn-' + color + ' active');
              }
              else {
                  $button
                      .removeClass('btn-' + color + ' active')
                      .addClass('btn-default');
              }
          }

          // Initialization
          function init() {

              updateDisplay();

              // Inject the icon if applicable
              if ($button.find('.state-icon').length == 0) {
                  $button.prepend('<i class="state-icon ' + settings[$button.data('state')].icon + '"></i>');
              }
          }
          init();
      });

        $(".numbers_dialog").each(function(i) {
            if ($(this)[0].innerHTML > remain) {
                $(this)[0].disabled = true;
                $(this).css("background-color", "red");
            }else{
                $(this).css("background-color", "green");
            }
        });

        }
    });

    $("#save_dialog").click(
        function() {
          debugger;
            var addons_list = [];
            $(".items-for-addons").each(function(i) {
                var addon = {};
                addon["parent_qty"] = $(this).attr("data-group-qty");
                addon["parent_item"] = $("#new_nump_addons").attr("data-parent-item");
                $(this).each(function() {
                    addon["addons"] = $(this).find("input:checked").map(function() {
                        return { "addon": $(this).val(), "price": $(this).attr("data-price") }
                    }).get();

                });
                addons_list.push(addon);
            });

        var remain = parseInt($("#remain").text());
        if (remain > 0){
         var addon = {};
         addon["parent_qty"] = remain;
         addon["parent_item"] = $("#new_nump_addons").attr("data-parent-item");
         addon["addons"] = [{ "addon": "قياسي - Standard", "price": 0 }];
         addons_list.push(addon);
        }

            var final_array_items = [];
            for (var i = 0; i < addons_list.length; i++) {
                for (var j in addons_list[i]["addons"]) {
                    var addon_row = {
                        "group_id": i,
                        "addon": addons_list[i]["addons"][j]["addon"],
                        "parent_qty": addons_list[i]["parent_qty"],
                        "parent_item": addons_list[i]["parent_item"],
                        "price": addons_list[i]["addons"][j]["price"]
                    };
                    final_array_items.push(addon_row)
                };
            };
            var item_parent = $("#new_nump_addons").attr("data-parent-item");
            for (var i = cur_pos.frm.doc.addons.length - 1; i >= 0; i--) {
                if (cur_pos.frm.doc.addons[i].parent_item == item_parent) {
                    cur_pos.frm.doc.addons.splice(i, 1);
                };
            };
            cur_pos.frm.doc.addons.push(...final_array_items);

            cur_pos.clear_selected_row();
            cur_pos.rerender_pos_bill_item_new();

        }
      );
    }

    rerender_pos_bill_item_new(){
      var addons = cur_pos.frm.doc.addons;
      var array_addons_for_display = [];
      var $items = this.wrapper.find(".items").empty();

      var groupBy = function(xs, key) { return xs.reduce(function(rv, x) { (rv[x[key]] = rv[x[key]] || []).push(x); return rv; }, {}); };
      var parentsGroup =groupBy(addons,'parent_item')
      var unique =[]
      for (var key in parentsGroup) {
        var item = groupBy(parentsGroup[key],'group_id')
        for(var key2 in item){
          var obj = {addon:[],parent_qty:item[key2][0].parent_qty,parent_item:key,group_id:key2}
          obj['addon'] = item[key2].map((function (row) { return row.addon }));
          unique.push(obj) }
        }

      $.each(cur_pos.frm.doc.items || [], function (i, d) {
        $(frappe.render_template("pos_bill_item_new", {
          item_code: d.item_code,
          addons : unique,
          item_name: (d.item_name === d.item_code || !d.item_name) ? "" : ("<br>" + d.item_name),
          qty: d.qty,
          discount_percentage: d.discount_percentage || 0.0,
          actual_qty: cur_pos.actual_qty_dict[d.item_code] || 0.0,
          projected_qty: d.projected_qty,
          rate: format_currency(d.rate, cur_pos.frm.doc.currency),
          amount: format_currency(d.amount, cur_pos.frm.doc.currency),
          selected_class: (cur_pos.item_code == d.item_code) ? "active" : ""
        })).appendTo($items);
      });
    }

    clear_addons(){
      var items = cur_pos.frm.doc.items;
      var addons = cur_pos.frm.doc.addons;
      var item_dict = {};
      var item_group_dict = {};
      if(cur_pos.frm.doc.addons != null){
      for (var i = addons.length - 1; i >= 0; i--) {
        if(addons[i]["parent_item"] in item_dict){
          if(addons[i]["parent_item"] in item_group_dict){
            var items_in = item_group_dict[addons[i]["parent_item"]]
            if(items_in.includes(parseInt(addons[i]["group_id"]))){
            }else{
              item_dict[addons[i]["parent_item"]] = parseInt(item_dict[addons[i]["parent_item"]])+parseInt(addons[i]["parent_qty"]);
              item_group_dict[addons[i]["parent_item"]].push(parseInt(addons[i]["group_id"]));
            }
          }
        }else{
          item_dict[addons[i]["parent_item"]] = parseInt(addons[i]["parent_qty"]);
          item_group_dict[addons[i]["parent_item"]] = [parseInt(addons[i]["group_id"])];

        }
      };
      for (var x in item_dict) {
        var checker_x = true;
        for (var i = items.length - 1; i >= 0; i--) {
          if (x == items[i].item_code){
            checker_x = false;
            if( parseInt(items[i].qty) < parseInt(item_dict[x]) ){
              frappe.msgprint("item Qty is bigger than addons attached to it");
            }
          }
        }
        if(checker_x){
          for (var i = addons.length - 1; i >= 0; i--) {
            if (addons[i]["parent_item"] == x){
              addons.splice( i, 1 );
            }
          }
          cur_pos.frm.doc.addons = addons
        }
      };
          }

    }

    get_rendered_addons(addons,item_code){
      if(addons.length >0){
        var data = addons;
        var parent_template = "";
        var result = "";
        var cleand_addon = [];
        var addons_list = cur_pos.item_data.filter(obj => {
          return obj.item_group === "اضافات - Additions To The Sandwich"
        });

        for(var row in data){
            if (data[row].parent_item == item_code){
                if (cleand_addon.length >0){
                  var idg = [];
                  for (var i = cleand_addon.length - 1; i >= 0; i--){
                      idg.push(cleand_addon[i].group_id);
                  }
                  if(idg.includes(data[row].group_id)){
                    for (var i = cleand_addon.length - 1; i >= 0; i--) {
                      if (data[row].group_id == cleand_addon[i].group_id){
                          cleand_addon[i]['addon'].push({"name":data[row].addon,"price":data[row].price})
                      }
                    }
                  }
                  else{
                    cleand_addon.push({
                        "group_id":data[row].group_id,
                        "addon": [{"name":data[row].addon,"price":data[row].price}],
                        "parent_qty": data[row].parent_qty,
                        "parent_item": data[row].parent_item
                        })
                  }
                }
                else{
                  cleand_addon.push({
                      "group_id":data[row].group_id,
                      "addon": [{"name":data[row].addon, "price":data[row].price }],
                      "parent_qty": data[row].parent_qty,
                      "parent_item": data[row].parent_item
                      })
                }
            }
          }

        for(var row in cleand_addon){
            var addons_template="";
            var x = [];
            for (var i =  cleand_addon[row].addon.length - 1; i >= 0; i--) {
              x.push(cleand_addon[row].addon[i].name);
            }
            for(var addon in addons_list){
                if(x.includes(addons_list[addon].name)){
                    addons_template = addons_template + `<label class="checkbox-inline" style="padding: 0px 40px 40px 30px;font-size: 18px;">
                    <input class= "addons_add" style=" transform: scale(3) !important; margin-left: -26px;"
                    type="checkbox" checked  value="${addons_list[addon].name}">${addons_list[addon].name}</label>`
                }else{
                    addons_template = addons_template + `<label class="checkbox-inline" style="padding: 0px 40px 40px 30px;font-size: 18px;">
                    <input class= "addons_add" style=" transform: scale(3) !important; margin-left: -26px;"
                      type="checkbox" value="${addons_list[addon].name}">${addons_list[addon].name}</label>`
                }
            }

            parent_template = parent_template+`
              <div class="modal-body">
                  <h3 class="collapsible-custom" data-value =${cleand_addon[row].parent_qty}>Total Number of Items ${cleand_addon[row].parent_qty}</h3>
                  <div class="items-for-addons" data-group-qty =${cleand_addon[row].parent_qty}>
                  ${addons_template}
                  </div>
              </div>`
        }
        return parent_template
      }
    }

    hide_section(addon){
      $(addon).siblings(".items-for-addons").slideToggle("fast");
      $(addon).find("span").toggleClass("glyphicon-chevron-down glyphicon-chevron-up");
    }
  }
  erpnext.pos.PointOfSale = PointOfSale;


} catch (e) {
  console.log("error", e);


//   var idx;
//  $(".item-cart-items").find(".pos-bill-item, .active").each(function(index,g) {
//     if($(g).hasClass( "active" )){
//       idx = g;
//     }
//   });

//   var idx;
//   var cart_list = $(".item-cart-items").find(".pos-bill-item, .active");
//   for (let i = 0; i < cart_list.length; i++) {
//     const element = cart_list[i];
//     if($(cart_list[i]).hasClass( "active" )){
//       idx = g;
//     }
//   }
//   console.log(idx);

}
// function dddd(g) {
//   console.log($(g).hasClass("active"));
// }

// function mapOrder (array, order, key) {

//   array.sort( function (a, b) {
//     var A = a[key], B = b[key];

//     if (order.indexOf(A) > order.indexOf(B)) {
//       return 1;
//     } else {
//       return -1;
//     }

//   });

//   return array;
// };


/**
 * Example:
 */


// item_order = cur_pos.items_order.map(p=>p.item_code)

// ordered_array = mapOrder(cur_pos.items, item_order, 'name');
// console.log("ordered Array ", ordered_array);
