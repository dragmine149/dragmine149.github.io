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
    .then((value) => document.getElementById(element_id).innerHTML = value);
}

function load_blog(blog) {
  const url = new URL(location);
  const page_location = url.origin + `/Blog/${blog}.md`;
  const url_page = `${url.origin}/blog.html?blog=${blog}`;
  fetch(page_location)
    .then((response) => response.text())
    .then(
      /**
      * @param {String} value
      */
      (value) => {
        let marked = window.marked;
        document.getElementById('blog_content').innerHTML = marked.parse(value);
      });
  history.pushState({}, "", url_page);
}


function load_blog_list() {
  const url = new URL(location);
  const page_location = url.origin + "/Blog/categories.json";
  fetch(page_location)
    .then((response) => response.json())
    .then(
      /**
      *
      * @param {JSON} value
      */
      (value) => {
        console.log(value);
      });
}


function load_blog_from_url() {
  const url = new URL(location);
  const blog = url.searchParams.get('blog');
  if (blog == null) {
    return;
  }
  load_blog(blog);
}

load_blog_from_url();
