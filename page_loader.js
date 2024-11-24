/**
* Gets the root of the page.
* @returns The page
*/
function get_current_page() {
  const url = new URL(location);
  const page_location = url.origin + "/";
  return page_location;
}

/**
*
* @param {String} element_id The id of the element to replace the text with
* @param {String} page_location The page location to load.
*/
function load_page_content(element_id, page_location) {
  fetch(page_location)
    .then((response) => response.text())
    .then((value) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, 'text/html');
      document.getElementById(element_id).replaceWith(doc.getElementById(element_id));

      // Allows loading of the script tags.
      const scripts = document.getElementById(element_id).getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const refrence_script = scripts[i];
        // console.log({
        //   refrence_script,
        //   'load': refrence_script.dataset.load
        // });
        if (refrence_script.dataset.load == "ignore") {
          refrence_script.remove();
          continue;
        }

        const new_script = document.createElement('script');

        new_script.id = refrence_script.id;
        new_script.src = refrence_script.src;

        if (refrence_script.dataset.load == "head") {
          document.head.appendChild(new_script);
          refrence_script.remove();
          continue;
        }

        refrence_script.parentNode.insertBefore(new_script, refrence_script);
        refrence_script.remove();
      }
    });
}

/**
*
* @param {String} page The page to laod
* @param {String} params Search paramaters
*/
function load_page(page, params = null) {
  const page_location = get_current_page() + page;
  load_page_content('content', page_location);
  history.pushState({}, "", page_location + params);
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
