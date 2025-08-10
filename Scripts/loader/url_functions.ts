function get_url() {
  return new URL(location.toString());
}

/**
* Gets the root of the page.
* Can't just return `https://dragmine149.github.io/` due to running it locally (`localhost:8000`), or evenutally under a different domain.
* @returns The page
*/
function get_current_page_root() {
  const url = get_url();
  return get_root_from_url(url);
}

/**
* Gets the current subpage.
* @returns The subpage name
*/
function get_current_subpage() {
  const url = get_url();
  return get_subpage_from_url(url);
}

/**
* Gets the current root subpage
* @returns The current root subpage
*/
function get_current_root_subpage() {
  const url = get_url();
  return `${get_root_from_url(url)}/${get_subpage_from_url(url)}`;
}

/**
* Gets the current branch name from the URL
* @returns The name of the current branch
*/
function get_current_branch() {
  const url = get_url();
  return get_branch_from_url(url);
}

/**
* Gets the root of the page
* @param url The url to get the root from
* @returns The root of the site
*/
function get_root_from_url(url: URL) {
  return url.origin;
}

/**
* Gets the subpage of the page
* @param url The url to get the subpage from
* @returns The subpage of the site
*/
function get_subpage_from_url(url: URL) {
  const matches = url.pathname.match(/[^\/]+\/?$/);
  if (matches === null) {
    return '';
  }
  return matches[0].replace(/\/$/, '');
}

/**
* Gets the branch of the page
* @param url The url to get the branch from
* @returns The name of the branch
*/
function get_branch_from_url(url: URL) {
  let branches = url.pathname.match(/Branches\/.*?\//);
  if (branches == null) {
    return '';
  }
  return branches[1] as string;

  // return url.pathname.includes('Branches/') ? [1] as string : '';
}

function our_site() {
  let url = get_url();
  return url.hostname == 'dragmine149.github.io' || url.hostname == 'localhost';
}

export { get_branch_from_url, get_current_branch, get_current_page_root, get_current_root_subpage, get_current_subpage, get_root_from_url, get_subpage_from_url, get_url, our_site };
