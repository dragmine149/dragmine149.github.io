let page_history = [];
let page_index = -1;

// TODO: Improve this whole page system to be more integrated with the browser.

function previous_page() {
  if (page_history.length <= 0) {
    return;
  }

  page_index -= 1;

  let previous = page_history[page_index];
  load_page(previous[0], previous[1], false);

  document.getElementById('navigation-previous').disabled = page_index <= 0;
  document.getElementById('navigation-next').disabled = page_index >= page_history.length - 1;
}


function next_page() {
  if (page_index >= page_history.length) {
    return;
  }

  page_index += 1;

  let next = page_history[page_index];
  load_page(next[0], next[1], false);

  document.getElementById('navigation-previous').disabled = page_index <= 0;
  document.getElementById('navigation-next').disabled = page_index >= page_history.length - 1;
}


function add_page_to_history(data) {
  if (page_index == page_history.length - 1) {
    page_history.push(data);
    page_index += 1;

    document.getElementById('navigation-previous').disabled = page_index <= 0;
    document.getElementById('navigation-next').disabled = page_index >= page_history.length - 1;
    return;
  }

  for (let i = 0; i < page_history.length - 1 - page_index; i++) {
    page_history.pop();
  }
  page_history.push(data);
  page_index += 1;

  document.getElementById('navigation-previous').disabled = page_index <= 0;
  document.getElementById('navigation-next').disabled = page_index >= page_history.length - 1;
}



window.addEventListener('popstate', (event) => {
  console.log({ event, page_history });
  console.log(window.history.length);
})
window.addEventListener('hashchange', (event) => {
  console.log(event);
})

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
    if (refrence_script.src.length == 0) {
      new_script.innerHTML = refrence_script.innerHTML;
    } else {
      new_script.src = refrence_script.src;
    }

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
function load_page(page, params = null, history_save = true) {
  const page_location = get_current_page() + page;

  if (page_location == location.href) {
    return; // Don't do stuff if we are already on that page.
  }

  load_page_content('content', page_location, page);
  history.pushState({
    name: page
  }, "", page_location + (params == null ? "" : params));

  if (history_save) {
    add_page_to_history([page, params]);
  }
}


function load_page_from_url() {
  const url = new URL(location);
  const query = url.searchParams.get('load');
  if (query == null) {
    console.log("Loaded main page due to no search params");
    load_page('main_page.html');
    return;
  }
  url.searchParams.delete('load');
  // console.log(url);

  const page_path = query.split('/');
  load_page(page_path[0], url.search);
}

function aoc_2024() {
  history.pushState({}, "", get_current_page() + "?blog=aoc%2F2024&load=blog.html");
  load_page_from_url();
}

load_page_from_url();

setTimeout(() => {
  if (document.getElementById('navigation').classList.has('active')) {
    document.getElementById('navigation').classList.remove('active');
  }
}, 5_000);

document.getElementById('navigation').classList.contains(token)
