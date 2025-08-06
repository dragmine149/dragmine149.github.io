import { snackbar, SnackbarArea } from './snackbar_hover';
import { loader, RETURN_TYPE } from './loader/loader.js';
import { page } from './loader/page.js';
import { settings } from './Settings/settings.js';
import './DayNightCycle/background';

// Script to run stuff on page load to finish loading everything else
function socials() {
  // TODO: Move this around on how this gets activated
  document.getElementById('socials')?.classList.toggle("active");
}

setTimeout(() => {
  snackbar.remove_elements(SnackbarArea.Top_Middle);
}, 5_000);

snackbar.set_area('navigation', SnackbarArea.Top_Middle);
snackbar.set_area('Settings', SnackbarArea.Top_Right);

document.getElementById("snackbar-tl")?.addEventListener('click', () => snackbar.toggle_area(SnackbarArea.Top_Left));
document.getElementById("snackbar-tm")?.addEventListener('click', () => snackbar.toggle_area(SnackbarArea.Top_Middle));
document.getElementById("snackbar-tr")?.addEventListener('click', () => snackbar.toggle_area(SnackbarArea.Top_Right));
document.getElementById("snackbar-ml")?.addEventListener('click', () => snackbar.toggle_area(SnackbarArea.Middle_Left));
document.getElementById("snackbar-mr")?.addEventListener('click', () => snackbar.toggle_area(SnackbarArea.Middle_Right));
document.getElementById("snackbar-bl")?.addEventListener('click', () => snackbar.toggle_area(SnackbarArea.Bottom_Left));
document.getElementById("snackbar-bm")?.addEventListener('click', () => snackbar.toggle_area(SnackbarArea.Bottom_Middle));
document.getElementById("snackbar-br")?.addEventListener('click', () => snackbar.toggle_area(SnackbarArea.Bottom_Right));

document.getElementById("nav_main")?.addEventListener('click', () => page.load_page('main_page.html'));
document.getElementById("nav_blog")?.addEventListener('click', () => page.load_page('Blog'));
document.getElementById("nav_proj")?.addEventListener('click', () => page.load_page('Projects'));
document.getElementById("nav_soci")?.addEventListener('click', socials);

document.getElementById("settings-more")?.addEventListener('click', () => settings.visible());
document.getElementById("settings-hide")?.addEventListener('click', () => settings.visible());

async function set_branch() {
  let url = new URL(location.toString());
  if (url.hostname !== 'localhost') return;

  url.pathname = ".git/HEAD";
  let branch = await loader.get_contents_from_server(url.href, RETURN_TYPE.text);
  branch = branch.replace(/^ref: refs\/heads\//, '');
  return branch;
}

(async () => {
  let branch = await set_branch();
  let elm = document.getElementById("branch");
  if (elm == null) { return; }
  elm.innerText = branch;
  if (branch == undefined) {
    elm.remove();
  }
})();

// async function load_blog() {
//   let module = {
//     "blog": {
//       "module": async () => await import('../Blog/blog')
//     }
//   }
//   // let blog = await import(module["blog"].module);
//   let blog = await module["blog"].module();
//   console.log(blog.blog.loaded_list_items);
// }

// document.getElementById("test")?.addEventListener('click', () => load_blog());
