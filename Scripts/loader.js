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
  document.getElementById("branch").innerText = await set_branch();
})();
