// Script to run stuff on page load to finish loading everything else
function socials() {
  // TODO: Move this around on how this gets activated
  document.getElementById('socials').classList.toggle("active");
}

setTimeout(() => {
  snackbar.remove_elements(snackbar.AREA.Top_Middle);
}, 5_000);

snackbar.set_area('navigation', snackbar.AREA.Top_Middle);
snackbar.set_area('Settings', snackbar.AREA.Top_Right);
