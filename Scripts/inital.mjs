import { snackbar } from './snackbar_hover.mjs';
import { loader } from './new_loader.mjs';

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

document.getElementById("snackbar-tl").addEventListener('click', snackbar.toggle_area(snackbar.AREA.Top_Left));
document.getElementById("snackbar-tm").addEventListener('click', snackbar.toggle_area(snackbar.AREA.Top_Middle));
document.getElementById("snackbar-tr").addEventListener('click', snackbar.toggle_area(snackbar.AREA.Top_Right));
document.getElementById("snackbar-ml").addEventListener('click', snackbar.toggle_area(snackbar.AREA.Middle_Left));
document.getElementById("snackbar-mr").addEventListener('click', snackbar.toggle_area(snackbar.AREA.Middle_Right));
document.getElementById("snackbar-bl").addEventListener('click', snackbar.toggle_area(snackbar.AREA.Bottom_Left));
document.getElementById("snackbar-bm").addEventListener('click', snackbar.toggle_area(snackbar.AREA.Bottom_Middle));
document.getElementById("snackbar-br").addEventListener('click', snackbar.toggle_area(snackbar.AREA.Bottom_Right));

/**
* Capitalise a string.... Why does JS not have this already?
* @param {string} str The string to capitalise
* @returns The same string, but with a capital start
*/
function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function set_branch() {
  let url = new URL(location);
  if (url.hostname !== 'localhost') return;

  url.pathname = ".git/HEAD";
  let branch = await loader.get_contents_from_server(url.href, false, loader.RETURN_TYPE.text);
  branch = branch.replace(/^ref: refs\/heads\//, '');
  return branch;
}

(async () => {
  let branch = await set_branch();
  document.getElementById("branch").innerText = branch;
  if (branch == undefined) {
    document.getElementById("branch").remove();
  }
})();
