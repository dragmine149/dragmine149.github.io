class Blog {
  /** @type {boolean} Variable to check if we have loaded the list or not, to prevent reloading of the list. */
  loaded_list_items = false;

  constructor() {
    // initialise the markdown module.
    this.__load_markdown();

    // page.listen_to_state_pop("blog", v => this.load_blog(v, false));
    customHistory.add_listener("Blog", (v) => {
      this.load_blog(v.search.get("blog"));
    });

    Object.freeze(this.__blog_state);

    this.load_blog_from_url();
  }

  __load_markdown() {
    // custom function to make sure that markdown exists before loading.
    // As technically it doesn't need to exist until we load a blog. Hence we can prevent any errors.
    if (this.markdown) return;
    if (Markdown) {
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
      }, document.getElementById("blog_content"));
    }
  }

  __blog_state = {
    List: 0, Viewer: 1
  }

  /**
  * Set the blog state as being shown or the list.
  * @param {Blog.__blog_state} state The state to show
  */
  set_blog_state(state) {
    const blog_content = document.getElementById('blog_content');
    const blog_list = document.getElementById('blog_list');
    switch (state) {
      case this.__blog_state.List:
        console.log(`Switching blog to list mode.`);
        if (blog_list) blog_list.hidden = false;
        if (blog_content) blog_content.hidden = true;
        return;
      case this.__blog_state.Viewer:
        console.log(`Switching blog to viewer mode.`);
        if (blog_list) blog_list.hidden = true;
        if (blog_content) blog_content.hidden = false;
        return;
    }
  }

  /**
  * Load a blog, or load the list if an invalid blog is parsed.
  * @param {string} blog_page The blog to load
  * @returns
  */
  async load_blog(blog_page) {
    if (blog_page == null || blog_page === "" || blog_page == undefined) {
      this.load_blog_list();
      return;
    }

    this.__load_markdown();

    // replace the search terms aspect if it gets left behind for some reason.
    if (blog_page.includes("?blog=")) {
      blog_page = blog_page.replaceAll("?blog=", "");
      console.warn("blog_page still contained ?blog, autoremoved.");
      console.trace("stack debug");
    }

    console.log(`Loading blog: ${blog_page} `);
    const blog_details = await loader.get_contents_from_server(`Blog/Posts/${blog_page}.md`, true, loader.RETURN_TYPE.text);
    this.markdown.parse(blog_details);

    this.set_blog_state(this.__blog_state.Viewer);
    customHistory.store_page(new URL(`${page.get_current_root_subpage()}?blog=${blog_page}`));
  }

  /**
   * Create the list items for the blog list.
   * Happens in a separate function as it only really needs to be called once due to the cache in loader.
   */
  __create_list_items() {
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

      document.getElementById('blog_list').appendChild(elm);

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
    this.blog_list = await loader.get_contents_from_server(`Blog/list.json`, true, loader.RETURN_TYPE.json);
    this.__create_list_items()

    this.set_blog_state(this.__blog_state.List);
    customHistory.store_page(new URL(`${page.get_current_root_subpage()}`));
  }

  load_blog_from_url(url) {
    if (!url) {
      url = new URL(location);
    }
    this.load_blog(url.searchParams.get('blog'));
  }
}

const blog = new Blog();

function Blog_default_0() {
  // by default, after everything has loaded.
  blog.load_blog_from_url();
}
