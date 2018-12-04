//prevent contextmenu
document.addEventListener('contextmenu', event => event.preventDefault());

//prevent selection
if (typeof document.onselectstart != "undefined") {
  document.onselectstart = new Function("return false");
} else {
  document.onmousedown = new Function("return false");
  document.onmouseup = new Function("return true");
}