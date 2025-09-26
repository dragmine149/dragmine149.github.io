import '../Modules/modules_extension';
import { snackbar, SnackbarArea } from './snackbar_hover';
import { loader, RETURN_TYPE } from './loader/loader';
import { page } from './loader/page';
import { settings } from './Settings/settings';
import './DayNightCycle/background';
import { get_url } from './loader/url_functions';

// Script to run stuff on page load to finish loading everything else
function socials() {
  // TODO: Move this around on how this gets activated
  document.getElementById('socials')?.classList.toggle("active");
}

settings.set_setting("Datetime", "default_state", -1);
settings.set_setting("Datetime", "enabled", false);

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

document.getElementById("nav_main")?.addEventListener('click', (e) => {
  if (e.ctrlKey || e.shiftKey) return true;
  e.preventDefault();
  page.load_page('main_page.html');
  // console.log("Cancelling load!");
  return false;
});
document.getElementById("nav_blog")?.addEventListener('click', (e) => {
  if (e.ctrlKey || e.shiftKey) return true;
  e.preventDefault();
  page.load_page('Blog');
  // console.log("Cancelling load!");
  return false;
});
document.getElementById("nav_proj")?.addEventListener('click', (e) => {
  if (e.ctrlKey || e.shiftKey) return true;
  e.preventDefault();
  page.load_page('Projects');
  // console.log("Cancelling load!");
  return false;
});
document.getElementById("nav_soci")?.addEventListener('click', socials);

document.getElementById("settings-more")?.addEventListener('click', () => settings.visible());
document.getElementById("settings-hide")?.addEventListener('click', () => settings.visible());

globalThis.import_debug = async () => await import('./debug');



async function getGitHeadInfo(head: string): Promise<string> {
  const trimmedContent = head.trim();

  if (trimmedContent.startsWith('ref: refs/heads/')) {
    // It's a branch!
    return trimmedContent.replace('ref: refs/heads/', '');
  }
  if (trimmedContent.length >= 7) {
    // It's likely a commit hash!
    return trimmedContent.substring(0, 6);
  }

  return `Unknown format: ${trimmedContent}`;
}

async function set_branch() {
  let url = get_url();
  if (url.hostname !== 'localhost') return;

  url.pathname = ".git/HEAD";
  let branch = await loader.get_contents_from_server(url.href, RETURN_TYPE.text) as string;
  return getGitHeadInfo(branch);
}

(async () => {
  let branch = await set_branch();
  let elm = document.getElementById("branch");
  if (elm == null) { return; }
  if (branch == undefined) {
    elm.remove();
    return;
  }
  elm.innerText = branch;
})();
