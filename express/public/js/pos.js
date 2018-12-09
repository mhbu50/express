//prevent contextmenu
document.addEventListener('contextmenu', event => event.preventDefault());

//prevent selection
if (typeof document.onselectstart != "undefined") {
  document.onselectstart = new Function("return false");
} else {
  document.onmousedown = new Function("return false");
  document.onmouseup = new Function("return true");
}
setTimeout(function() {
  $('[data-value ="All Item Groups"]').remove();
  $('[data-value ="Raw Material"]').remove();
  $('[data-value ="Sub Assemblies"]').remove();
  $('[data-value ="Consumable"]').remove();
  $('[data-value ="POS Items"]').remove();
  $('[data-value ="Stock Item"]').remove();
  $('[data-value ="Processed Raw Material"]').remove();
  $('[data-value ="Additions To The Sandwich - اضافات"]').remove();
  $('[data-value ="اضافات"]').remove();
}, 2000);