import { loader, RETURN_TYPE } from '../Scripts/loader/loader';
import { customHistory } from '../Scripts/loader/customHistory';
import { page } from '../Scripts/loader/page';
import * as url_functions from '../Scripts/loader/url_functions';

import { settings } from '../Scripts/Settings/settings';
import { Markdown, MarkdownSettings } from '../Modules/markdown.js';

enum BLOG_STATE {
  List, Viewer
}

type BlogFormat = {
  date: string;
  categories: string[];
  preview: string;
}


class Blog {
  /** Variable to check if we have loaded the list or not, to prevent reloading of the list. */
  loaded_list_items = false;
  markdown: Markdown;
  blog_list: BlogFormat[];

  constructor() {
    // initialise the markdown module.
    this.#load_markdown();

    // page.listen_to_state_pop("blog", v => this.load_blog(v, false));
    customHistory.add_listener("Blog", (v) => {
      // this.load_blog(v.search?.get("blog"));

      // load from the current url instead of whichever url got popped.
      this.load_blog(url_functions.get_url().searchParams.get("blog"));
    });

    settings.add_listener("Blog", "title", (v) => {
      console.log("Updating blog title:", v);
      let elm = document.querySelector('h1[id="title"]') as HTMLHeadingElement | null;
      if (!elm) return;
      elm.style.fontSize = v + "rem";
    });

    page.addFinishListener("Blog", () => {
      this.load_blog_from_url();
    })
  }

  async #load_markdown() {
    // custom function to make sure that markdown exists before loading.
    // As technically it doesn't need to exist until we load a blog. Hence we can prevent any errors.
    if (this.markdown) return;

    this.markdown = new Markdown({
      markedLocalTime: true,
      markedFootnote: true,
      markedImprovedImage: true,
      markedCustomHeadingId: true,
      markedHighlight: true,
      markedRemoteImage: true,
      markedLocalLink: (url) => {
        // console.warn(`Loading page from URL: ${url}`);

        if (url.searchParams.has("blog")) {
          console.log("Loading blog from URL:", url);
          this.load_blog(url.searchParams.get("blog"));
          return true;
        }
        console.log("Loading page from URL:", url);

        page.load_page_from_url(url);
        return true;
      },
    });
  }


  /**
  * Set the blog state as being shown or the list.
  * @param state The state to show
  */
  set_blog_state(state?: BLOG_STATE) {
    const blog_content = document.getElementById('blog_content');
    const blog_list = document.getElementById('blog_list');
    const back = document.getElementById("blog_back") as HTMLButtonElement | null;
    switch (state) {
      case BLOG_STATE.List:
        console.log(`Switching blog to list mode.`);
        if (blog_list) blog_list.hidden = false;
        if (blog_content) blog_content.hidden = true;
        if (back) back.disabled = true;
        return;
      case BLOG_STATE.Viewer:
      default:
        console.log(`Switching blog to viewer mode.`);
        if (blog_list) blog_list.hidden = true;
        if (blog_content) blog_content.hidden = false;
        if (back) back.disabled = false;
        return;
    }
  }

  /**
  * Load a blog, or load the list if an invalid blog is parsed.
  * @param blog_page The blog to load
  */
  async load_blog(blog_page?: string | null) {
    if (blog_page === "" || blog_page == undefined || blog_page == null) {
      this.load_blog_list();
      return;
    }

    this.#load_markdown();
    this.markdown.set_obj(document.getElementById("blog_content") as HTMLElement);

    // replace the search terms aspect if it gets left behind for some reason.
    if (blog_page.includes("?blog=")) {
      blog_page = blog_page.replaceAll("?blog=", "");
      console.warn("blog_page still contained ?blog, autoremoved.");
      console.trace("stack debug");
    }

    console.log(`Loading blog: ${blog_page} `);
    const blog_details = await loader.get_contents_from_server(`Blog/Posts/${blog_page}.md`, RETURN_TYPE.text);
    this.markdown.parse(blog_details);

    this.set_blog_state(BLOG_STATE.Viewer);
    customHistory.store_page(new URL(`${url_functions.get_current_root_subpage()}?blog=${blog_page}`));
  }

  /**
   * Create the list items for the blog list.
   * Happens in a separate function as it only really needs to be called once due to the cache in loader.
   */
  #create_list_items() {
    if (this.loaded_list_items) {
      return;
    }

    Object.values(this.blog_list).forEach((v) => {
      if (document.getElementById(`blog-${v.date}`)) {
        return;
      }

      const elm = document.createElement('article');
      const title = document.createElement('h5');
      const preview = document.createElement('p');
      const categories = document.createElement('nav');

      elm.id = `blog-${v.date}`;
      elm.appendChild(title);
      elm.appendChild(preview);
      elm.appendChild(categories);

      title.innerText = v.date;
      preview.innerText = v.preview;

      document.getElementById('blog_list')?.appendChild(elm);

      v.categories.forEach((category) => {
        const fake_btn = document.createElement('a');
        fake_btn.classList.add("button");
        categories.appendChild(fake_btn);
        fake_btn.innerText = category;
      });

      elm.onclick = () => {
        console.log(`Clicked elm: ${v.date}`);
        blog.load_blog(v.date);
      }
    });

    this.loaded_list_items = true;
  }

  /**
  * Load the blog list from the server, and update history, blog visibility whilst at it.
  */
  async load_blog_list() {
    this.blog_list = await loader.get_contents_from_server(`Blog/list.json`, RETURN_TYPE.json);
    this.#create_list_items()

    this.set_blog_state(BLOG_STATE.List);
    customHistory.store_page(new URL(`${url_functions.get_current_root_subpage()}`));
  }

  load_blog_from_url(url?: URL) {
    if (!url) url = new URL(location.toString());

    this.load_blog(url.searchParams.get('blog'));
  }
}

const blog = new Blog();

// NOTE: Technically this is load in some weird module loading nonsense that probably needs to be cleaned up.
function initialise() {
  // by default, after everything has loaded.
  blog.load_blog_from_url();
  return true;
}

document.getElementById("blog_back")?.addEventListener('click', blog.load_blog_list);

export { blog, initialise }
