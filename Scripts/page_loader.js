class page_loader {
  /**
  * Used for saving search query paramters, like ?load, etc...
  * @type {String}
  */
  params;

  constructor() {
    this.cache = new Map();
    this.state_callback = new Map();

    const url = new URL(location);
    const query = url.searchParams.get("load");
    if (query == null) {
      this.load_page("main_page.html");
      return;
    }

    url.searchParams.delete("load");
    this.__page_loader(query, false);
    this.params = url.search;
    history.replaceState({
      state: query
    }, "", this.get_current_page() + query + (this.params == null ? "" : this.params));
  }

  /**
  * Gets the root of the page.
  * @returns The page
  */
  get_current_page() {
    const url = new URL(location);
    url.search = "";
    const page_location = url.origin + "/";
    return page_location;
  }

  get_current_subpage() {
    const url = new URL(location);
    url.search = "";
    return url.pathname.replace("/", "");
  }

  __warn_load(message) {
    document.getElementById('warnings').innerText = message;
    ui('#warnings');
  }
  /**
  * Get the content of a file. All in raw data.
  * @param {String} page
  * @returns {String} The file contents
  */
  async __get_content(page) {
    const result = await fetch(page, {
      headers: {
        "Cache-Control": "max-age=86400"
      }, mode: 'no-cors'
    });

    if (!result.ok) {
      console.log("Invalid request");
      this.__warn_load(`Failed to get page: ${page}.`);
    }

    return await result.text();
  }

  async __get_page_content(page) {
    if (this.cache.has(page)) {
      return this.cache.get(page);
    }
    let fetch_page = page;
    if (!page.endsWith(".html")) {
      fetch_page = fetch_page + "/index.html";
    }

    let content = await this.__get_content(fetch_page);
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    this.cache.set(page, doc.getElementById("content"));
    return this.cache.get(page);
  }

  async __script_loader(page) {
    const doc = await this.__get_page_content(page);
    console.log(doc);
    const scripts = doc.getElementsByTagName("script");

    // Allows loading of the script tags.
    const script_main = document.getElementById('scripts');
    let script_child = document.getElementById(`script_${page}`);

    // If we already loaded the scripts just call the main function.
    if (script_child != null) {
      console.log("Script exists! looking for function.");
      const func_to_call_name = `${page.toLowerCase()}_loader`;
      const func_to_call = window[func_to_call_name];
      if (typeof func_to_call === "function") {
        console.log("Function exists! Calling.");
        func_to_call();
        return;
      }
      return;
    }

    // create new information if we don't already have it.
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

      // assume by doing this the scripts will auto trigger.
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

  async __page_loader(page, history_push = true) {
    if (history_push) {
      this.push_state_to_history(page, {});
    }

    await this.__script_loader(page);

    let content = await this.__get_page_content(page);

    let title = content.getElementsByTagName('pageTitle').item(0);
    if (title != null) {
      document.getElementsByTagName('title').item(0).innerText = title.innerText;
    }

    document.getElementById("content").replaceWith(content);

  }

  /**
  *
  * @param {String} page
  * @param {Object} state
  */
  push_state_to_history(page, state, params = null) {
    if (Object.keys(state).length == 0) {
      state = {};
    }
    state["page"] = page;
    console.log({ params, "this": this.params });
    if (this.params == null || this.params == "") {
      this.params = params;
    }
    console.log(state);
    console.log(this.get_current_page() + page + (this.params == null ? "" : this.params));
    history.pushState(state, "", this.get_current_page() + page + (this.params == null ? "" : this.params));
  }

  async load_page(page, clear_query = false) {
    if (clear_query) {
      this.params = null;
    }
    await this.__page_loader(page);
  }

  async load_page_from_state(state) {
    // cancel load if we can't determin the page.
    if (state.page == undefined) {
      return;
    }

    await this.__page_loader(state.page, false);
  }

  listen_to_state_pop(id, callback) {
    this.state_callback.set(id, callback);
  }
  state_pop(id, value) {
    if (!this.state_callback.has(id)) {
      return;
    }
    console.log(`Calling ${id}`);
    this.state_callback.get(id)(value);
  }
}

let page = new page_loader();
window.addEventListener('popstate', (event) => {
  console.log(`Processing page pop! Details:`);
  console.log(event.state);

  if (page.get_current_subpage() != event.state.page) {
    page.load_page_from_state(event.state);
  }
  Object.entries(event.state).forEach((entry) => {
    if (entry[0] == "page") {
      return;
    }
    page.state_pop(entry[0], entry[1]);
  })
})
