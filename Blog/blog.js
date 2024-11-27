function view_blog() {
  const blog_content = document.getElementById('blog_content');
  const blog_list = document.getElementById('blog_list');

  blog_list.hidden = true;
  blog_content.hidden = false;
}

function view_blog_list() {
  const blog_content = document.getElementById('blog_content');
  const blog_list = document.getElementById('blog_list');

  blog_list.hidden = false;
  blog_content.hidden = true;
}


/**
* Load a blog post onto the page
* @param {String} blog The date of the block in the format YYYY-MM-DD
*/
function load_blog(blog) {
  // construct the URL
  const url = new URL(location);
  const page_location = url.origin + `/Blog/Posts/${blog}.md`;
  const url_page = `${url.origin}/blog.html?blog=${blog}`;

  // fetch the data
  fetch(page_location)
    .then((response) => {
      if (response.ok) {
        return response;
      }
      // cause a custom error if we failed to get the data
      console.log("Confused.png");
      const error = new Error(`Failed to get blog post (${blog})`);
      error.name = "FetchBlogFailed";
      throw error;
    })
    // translate into text
    .then((response) => response.text())
    .then(
      /**
      * @param {String} value
      */
      (value) => {
        // using marked, load the blog post into the page
        let marked = window.marked;
        document.getElementById('blog_content').innerHTML = new marked.Marked()
          // .use(markedFootnote(), customHeadingId(), markedHighlight({
          //   emptyLangClass: 'hljs',
          //   langPrefix: 'hljs language-',
          //   highlight(code, lang, info) {
          //     const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          //     return hljs.highlight(code, { language }).value;
          //   }
          // }))
          .use(markedCustomHeadingId())
          .use(markedFootnote())
          .use(markedHighlight.markedHighlight({
            emptyLangClass: 'hljs',
            langPrefix: 'hljs language-',
            highlight(code, lang, info) {
              const language = hljs.getLanguage(lang) ? lang : 'plaintext';
              return hljs.highlight(code, { language }).value;
            }
          }))
          .parse(value.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""));
      })
    .catch(
      /**
      * @param {Error} error
      */
      (error) => {
        // display any error if an error occured
        if (error.name == "FetchBlogFailed") {
          document.getElementById('blog_snackbar_content').innerText = error.message;
          ui("#blog_snackbar")
        }
      });

  // change the URL, history and display the blog on the page.
  history.pushState({}, "", url_page);
  view_blog();
}

function load_blog_list() {
  const url = new URL(location);
  const page_location = url.origin + "/Blog/Pages/1.json";
  fetch(page_location)
    .then((response) => response.json())
    .then(
      /**
      *
      * @param {JSON} value
      */
      (value) => {
        console.log(value);
        Object.entries(value).forEach((entry) => {
          const elm = document.createElement('article');
          const title = document.createElement('h5');
          const preview = document.createElement('p');
          const categories = document.createElement('nav');

          elm.appendChild(title);
          elm.appendChild(preview);
          elm.appendChild(categories);

          title.innerText = entry[0];
          preview.innerText = entry[1].preview;

          document.getElementById('blog_list').appendChild(elm);

          entry[1].categories.forEach((category) => {
            const fake_btn = document.createElement('a');
            fake_btn.classList.add("button");
            categories.appendChild(fake_btn);
            fake_btn.innerText = category;
          });

          elm.onclick = () => {
            console.log(`Clicked elm: ${entry[0]}`);
            load_blog(entry[0]);
          }
        });
      });
}


function load_blog_from_url() {
  const url = new URL(location);
  const blog = url.searchParams.get('blog');
  if (blog == null) {
    return false;
  }
  load_blog(blog);
  return true;
}

function blog_loader() {
  const blog_loaded = load_blog_from_url();
  if (!blog_loaded) {
    load_blog_list();
  }
}

blog_loader();
