/**
* Gets the root of the page.
* @returns The page
*/
function get_current_page() {
  const url = new URL(location);
  const page_location = url.origin + "/";
  return page_location;
}

/** @type {Map<String, HTMLElement>} */
const page_cache = new Map();

function load_page_content_from_cache(element_id, cache_name) {
  /** @type {HTMLElement} */
  const content = page_cache.get(cache_name);
  const scripts = content.getElementsByTagName('script');

  let title = content.getElementsByTagName('pageTitle').item(0);
  if (title != null) {
    document.getElementsByTagName('title').item(0).innerText = title.innerText;
  }

  document.getElementById(element_id).replaceWith(content);
  load_page_scripts_from_cache(scripts, cache_name);
}

/**
*
* @param {Document} document
* @param {String} page
*/
function load_page_scripts_from_cache(scripts, page) {
  // Allows loading of the script tags.

  const script_main = document.getElementById('scripts');
  let script_child = document.getElementById(`script_${page}`);

  // If we already loaded the scripts just call the main function.
  if (script_child != null) {
    console.log("Script exists! Calling function.");
    // console.log(`${page.substring(0, page.indexOf('.'))}_loader`);
    const func_to_call_name = `${page.substring(0, page.indexOf('.'))}_loader`;
    const func_to_call = window[func_to_call_name];
    if (typeof func_to_call === "function") {
      func_to_call();
      return;
    }
    return;
  }

  script_child = document.createElement('div');
  script_child.id = `script_${page}`;
  script_main.appendChild(script_child);

  for (let i = 0; i < scripts.length; i++) {
    const refrence_script = scripts[i];
    // console.log({
    //   refrence_script,
    //   'load': refrence_script.dataset.load
    // });
    if (refrence_script.dataset.load == "ignore") {
      continue;
    }

    const new_script = document.createElement('script');

    new_script.id = refrence_script.id;
    new_script.src = refrence_script.src;

    script_child.appendChild(new_script);
  }
}


/**
*
* @param {String} element_id The id of the element to replace the text with
* @param {String} page_location The page location to load.
* @param {String} page_name The name of the page, aka the file.
*/
function load_page_content(element_id, page_location, page_name) {
  if (page_cache.has(page_name)) {
    load_page_content_from_cache(element_id, page_name);
    return;
  }

  fetch(page_location)
    .then((response) => response.text())
    .then((value) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, 'text/html');
      page_cache.set(page_name, doc.getElementById(element_id));
    })
    .finally(() => {
      load_page_content_from_cache(element_id, page_name);
    });
}

/**
*
* @param {String} page The page to laod
* @param {String} params Search paramaters
*/
function load_page(page, params = null) {
  const page_location = get_current_page() + page;
  load_page_content('content', page_location, page);
  history.pushState({}, "", page_location + (params == null ? "" : params));
}


function load_page_from_url() {
  const url = new URL(location);
  const query = url.searchParams.get('load');
  if (query == null) {
    return;
  }
  url.searchParams.delete('load');
  // console.log(url);

  const page_path = query.split('/');
  load_page(page_path[0], url.search);
}

load_page_from_url();
