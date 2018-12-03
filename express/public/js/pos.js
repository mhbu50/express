//prevent contextmenu
document.addEventListener('contextmenu', event => event.preventDefault());

//prevent selection
document.addEventListener('mousedown', function(e) {
  e.preventDefault();
}, false);