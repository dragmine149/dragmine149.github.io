import { Verbose } from "./verbose.mjs";
import { modules } from "../Modules/modules.mjs";

class Loader {
  RETURN_TYPE = {
    text: 0, json: 1, document: 2
  }

  /**
  * @type {Map<string, any>}
  */
  cache;

  /**
  * Create a new loader class to load content from the server.
  */
  constructor() {
    Object.freeze(this.RETURN_TYPE);
    this.cache = new Map();
    this.verbose = new Verbose("Loader_Loader", "#edd29e");
  }

  /**
  * Show a warning message to the user when something goes wrong
  * @param {string} message The message to display
  */
  __warn_load(message) {
    const warnings = document.getElementById("warnings");
    if (warnings === null) {
      this.verbose.log(`Failed to get warnings element whilst trying to display: ${message}`);
      return;
    }

    warnings.innerText = message;
    if (typeof ui !== 'undefined') {
      // if beer.css.js loads, use it
      ui('#warnings');
      return;
    }

    // otherwise use our own custom timer.
    warnings.classList.add("active");
    setTimeout(() => {
      warnings.classList.remove("active");
    }, 5000);
  }

  /**
  * Get contents from the server
  * @param {string} server_url The url on the server to query
  * @param {bool} use_branch To use the specified branch instead of the main branch
  * @param {Loader.RETURN_TYPE} return_type The type of data to return.
  * @returns {any} Returns data based on the return type provided.
  */
  async get_contents_from_server(server_url, use_branch = true, return_type = this.RETURN_TYPE.text) {
    if (server_url instanceof URL) {
      this.verbose.warn(`server_url was URL object - converting to string`);
      server_url = server_url.href;
    }

    if (typeof server_url !== 'string') {
      this.__warn_load(`server_url must be string or URL (preferred string), got ${typeof server_url}`);
      return null;
    }

    if (!server_url.startsWith(page.get_current_page_root()) && !server_url.startsWith("http")) {
      this.verbose.log(`'${server_url}' did not contain http elm, adding site http elm`);
      // as we have to add the url, only add the branches section if we are within a branch.
      const branch_name = page.get_current_branch();
      const branch = use_branch && branch_name != '' ? `Branches/${branch_name}/` : '';
      server_url = `${page.get_current_page_root()}/${branch}${server_url}`;
    }

    const cache_name = `${server_url}-${return_type}`;

    // forceable overwrite the main page with well the main page as the main page is already loaded by the browser.
    if (server_url === `${page.get_current_page_root()}//index.html`) {
      server_url = `${page.get_current_page_root()}/main_page.html`
    }
    this.verbose.log(`Attempting to get data from '${server_url}' with: {'use_branch': ${use_branch}, 'return_type': ${return_type}}`);

    if (!use_branch) {
      // If we can't find it on the sub branch, then remove the branch as it might be on the main url.
      server_url = server_url.replace(/Branches\/.*?\//, '');
    }

    // get the results from cache, always better.
    const stored_data = this.__get_from_cache(cache_name);
    if (stored_data !== undefined) {
      this.verbose.log(`Found cache. Returning early`);
      // we have a cache, hence we don't need to worry about anything else.
      return stored_data;
    }

    // get the result from the server, as we have no cache clue.
    const result = await fetch(server_url, {
      headers: {
        "Cache-Control": "max-age=86400"
      }, mode: "no-cors"
    });

    // check to see if we have a result
    if (!result.ok) {
      if (use_branch) {
        // redo, but this time without the branch
        const no_branch = this.get_contents_from_server(server_url, false);
        if (no_branch !== null) {
          return no_branch;
        }
      }
      // warning message
      this.verbose.log(`Failed to load data, result:`, result);
      this.__warn_load(`Failed to load data from url: ${server_url} (via: ${result.url}).`);
      return null;
    }

    // return the apporipate type depending on what is asked of us.
    var promise_result;
    switch (return_type) {
      case this.RETURN_TYPE.json:
        promise_result = await result.json();
        return this.__cache_and_return(cache_name, promise_result);

      case this.RETURN_TYPE.document:
      case this.RETURN_TYPE.text:
      default:
        promise_result = await result.text();
        return this.__cache_and_return(cache_name, promise_result);
    }
  }

  /**
  * Cache the results and return the same result
  * @param {string} cache_name The server url that this result is from
  * @param {any} result The results from the server.
  * @returns {any} Returns the original result data provided, or slightly modified depending on the __get_from_cache method.
  */
  __cache_and_return(cache_name, result) {
    this.cache.set(cache_name, result);
    return this.__get_from_cache(cache_name);
  }

  /**
  * Get data from the cache and returns it depending on what type it is
  * @param {string} cache_name The name of the cache
  * @returns {any} The resulting data
  */
  __get_from_cache(cache_name) {
    const data = this.cache.get(cache_name);
    if (data === undefined) return data;

    const return_type = parseInt(cache_name.charAt(cache_name.length - 1));
    switch (return_type) {
      // document is special (hence this entire function)
      case this.RETURN_TYPE.document:
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        return doc;

      // the rest we can just do as normal.
      case this.RETURN_TYPE.json:
      case this.RETURN_TYPE.text:
      default:
        return data;
    }
  }
}

class Page {
  /**
  * Gets the root of the page.
  * Can't just return `https://dragmine149.github.io/` due to running it locally (`localhost:8000`), or evenutally under a different domain.
  * @returns The page
  */
  get_current_page_root() {
    const url = new URL(location);
    return this.get_root_from_url(url);
  }

  /**
  * Gets the current subpage.
  * @returns The subpage name
  */
  get_current_subpage() {
    const url = new URL(location);
    return this.get_subpage_from_url(url);
  }

  /**
  * Gets the current root subpage
  * @returns The current root subpage
  */
  get_current_root_subpage() {
    const url = new URL(location);
    return `${this.get_root_from_url(url)}/${this.get_subpage_from_url(url)}`;
  }

  /**
  * Gets the current branch name from the URL
  * @returns The name of the current branch
  */
  get_current_branch() {
    const url = new URL(location);
    return this.get_branch_from_url(url);
  }

  /**
  * Gets the root of the page
  * @param {URL} url The url to get the root from
  * @returns The root of the site
  */
  get_root_from_url(url) {
    return url.origin;
  }

  /**
  * Gets the subpage of the page
  * @param {URL} url The url to get the subpage from
  * @returns The subpage of the site
  */
  get_subpage_from_url(url) {
    const matches = url.pathname.match(/[^\/]+\/?$/);
    if (matches === null) {
      return '';
    }
    return matches[0].replace(/\/$/, '');
  }

  /**
  * Gets the branch of the page
  * @param {URL} url The url to get the branch from
  * @returns The name of the branch
  */
  get_branch_from_url(url) {
    return url.pathname.includes('Branches/') ? url.pathname.match(/Branches\/.*?\//)[1] : '';
  }

  /**
  * The cache of the elements
  * This would normally not be needed, but some scripts relay on elements to save code.
  * Without cache, elements might not load correctly as they are referencing things that exist but aren't visible.
  * @type {Map<string, HTMLElement>}
  */
  document_cache;

  constructor() {
    this.document_cache = new Map();
    this.verbose = new Verbose("Loader_Page", "#f01e94");
  }

  /**
  * Load page contents into the page itself.
  * @param {URL} url The url of the page to load
  * @param {HTMLElement} data The data of the page to load
  */
  load_page_contents(url, data) {
    document.getElementById("content").replaceWith(data);
    const title_elm = document.getElementsByTagName('title').item(0);
    // set the page title to the one provided in the page, or the actually page "category" per se.
    const new_title = content.getElementsByTagName('pageTitle').item(0);
    title_elm.innerText = new_title ? new_title.innerText : this.get_subpage_from_url(url);

    customHistory.store_page(url);
  }

  /**
    * Loads a page in the form of website.com/page?search#sub
    * @param {string} page The page to load (e.g. /Blog)
    * @param {URLSearchParams} search Search parameters (e.g. ?blog=2024-01-02)
    * @param {string} sub Page reference (e.g. #some_heading)
    * @param {string} branch_name The branch of the website to get the data from. Default to no branch
    */
  async load_page(page, search = null, sub = '', branch_name = '') {
    this.verbose.log(`Attempting to load page with data:`, { page, search, sub, branch_name });

    // sort out the data so that they are either empty or in a special form.
    let branch = branch_name == '' ? '' : `Branches/${branch_name}/`
    page = page.includes('main_page') ? '' : page;
    sub = sub == '' ? '' : `#${sub}`;
    search = (search == '' || search == null || search.size == 0) ? new URLSearchParams() : search;

    // check to see if the page change is too big to reload everything
    const looking_data = {
      branch: branch_name,
      page: page,
      search: search,
      sub: sub
    };
    const destination_url = customHistory.convert_pagedata_to_url(looking_data);
    if (!customHistory.is_new_page(looking_data)) {
      this.verbose.log(`Cancelling page load as changes aren't big enough to warrant change`);
      // if so, we're still going to that page
      customHistory.store_page(destination_url);
      // just call all scripts defaults instead.
      script.call_defaults_in_category(page);
      return;
    }

    const file = `${this.get_current_page_root()}/${branch}${page}${page.endsWith('.html') ? '' : '/index.html'}`;
    // check the cache for the element
    let data = this.document_cache.get(file);

    // load from server and make a new cache if it doesn't exist.
    if (data == undefined) {
      /** @type {Document} */
      const doc_data = await loader.get_contents_from_server(file, true, loader.RETURN_TYPE.document);
      data = doc_data.getElementById("content");
      this.document_cache.set(file, data);
    }

    // load the module data before loading the script data. modules are designed to have priority as they are used in most places.
    modules.load_modules_from_dom(data);
    // i don't really like this, but the 30ms wait should give enough time for most of the modules to load the important stuff at least.
    // going lower would just cause stability errors, hence 30ms
    await new Promise(resolve => setTimeout(resolve, 30));

    this.verbose.log(`New destination: ${destination_url} ({branch: ${branch}, page: ${page}, search: ${search}, sub: ${sub}})`);
    this.load_page_contents(destination_url, data);
    script.load_scripts(page, data);
  }

  /**
  * Designed to be called once upon loading the websie.
  * Calls `load_page` after decoding the url that has loaded this site.
  */
  load_page_from_url(url) {
    if (!url) {
      url = new URL(location);
    }
    this.verbose.log(`Attempting to load page from url: `, url);

    const branch = this.get_branch_from_url(url);
    let page = this.get_subpage_from_url(url);
    this.verbose.log(`page from url: ${page}`);

    // load the page from the url provided if we have said url.
    if (url.searchParams.has('load')) {
      page = url.searchParams.get('load');
      url.searchParams.delete('load');
    }

    const search = url.searchParams; // search is nice and easily separated
    const sub = url.hash;

    this.load_page(page, search, sub, branch);
  }

  /**
    * Creates a URLSearchParams object from a variable number of search parameter objects
    * @param {...Object} params - Objects containing search parameter key-value pairs
    * @returns {URLSearchParams} The combined search parameters
    */
  generate_search_params(...params) {
    const search_params = new URLSearchParams();

    for (const param_obj of params) {
      Object.entries(param_obj).forEach(([key, value]) => {
        search_params.append(key, value);
      });
    }

    return search_params;
  }
}

class Script {
  constructor() {
    this.__reload_self();
    this.verbose = new Verbose("Loader_Script", "#a9f831");
  }

  __reload_self() {
    if (this.scripts !== null && this.scripts !== undefined) {
      return;
    }
    this.scripts = document.getElementById("scripts");
  }

  /**
  * Checks to see if we have already loaded this script before
  * @param {string} src The source of the script to check for
  * @returns {boolean} Have we or have we not
  */
  __has_loaded(src) {
    return this.scripts.querySelector(`script[src="${src}"]`) != null;
  }

  /**
    * Load the scripts for a page.
    * @param {string} page_name - The name of the page, won't load stuff it's already loaded.
    * @param {HTMLElement} page_data - The script data to load.
    */
  load_scripts(category, page_data) {
    this.__reload_self();
    if (page_data == null) {
      this.verbose.error(`Failed to load page with category '${category}' as there was no page data...`);
      return;
    }

    // check to see if a category exists, if so call that instead of trying to add new scripts.
    // the page data should be cached anyway, and if it's not well tough.
    if (this.scripts.querySelector(`script[category="${category}"]`) !== null) {
      this.verbose.log(`Found script with category: ${category}, skipping...`);
      this.call_defaults_in_category(category);
      return;
    }

    // Find the scripts in the page
    const new_scripts = page_data.getElementsByTagName("script");
    for (let script_id = 0; script_id < new_scripts.length; script_id++) {
      const script = new_scripts.item(script_id);
      this.verbose.log(`Attempting to add new script: ${script.attributes.src?.value}`);
      if (script.src && this.__has_loaded(script.attributes.src?.value)) {
        this.verbose.warn(`Found already loaded script, continuing... (category was not picked up)`);
        this.verbose.trace();
        // this should RARLEY be hit, but it's to avoid cases like "redeclaration of variable", etc..
        continue;
      }

      // Create a new script element and copy everything across.
      const new_script = document.createElement("script");
      for (const attribute of script.getAttributeNames()) {
        new_script.setAttribute(attribute, script.getAttribute(attribute));
      }
      if (script.src.length == 0) {
        new_script.innerHTML = script.innerHTML;
      }
      // the category is set for other uses. So it's special.
      new_script.setAttribute("category", category);

      this.scripts.appendChild(new_script);
    }
  }

  /**
  * Call all default functions (if possible), in a certain category.
  * @param {string} category The category to call the scripts in.
  */
  call_defaults_in_category(category) {
    this.verbose.log(`Calling defaults on scripts of category: ${category}`);

    // filter out all of those in difference categories
    const children = Array.from(this.scripts.children).filter(child => child.attributes.category?.value === category);
    for (let script_id = 0; script_id < children.length; script_id++) {
      // test function to see if it exists
      const func_name = `${category}_default_${script_id}`;
      if (typeof window[func_name] !== "function") {
        continue;
      }
      // and call it.
      this.verbose.log(`Calling default function: ${func_name}`);
      window[func_name]();
    }
  }
}


class CustomHistory {
  /** @type {Map<String, Function>} */
  listeners;
  /**
   * A value to determine if we are processing the 'popstate' event.
   * During this time, some other checks need to be modified or skipped to avoid messing up the history.
   * @type {boolean}
   */
  poppin_jump = false;
  /** @type {URL} */
  current_url = null;

  constructor() {
    this.listeners = new Map();
    this.verbose = new Verbose("Loader_History", "#a1b2c3")

    // the event handler for dealing with browser.back and browser.forward
    window.addEventListener('popstate', () => {
      if (this.poppin_jump) {
        return;
      }
      this.poppin_jump = true;

      // get the current details.
      const currentUrl = new URL(window.location);
      const data = this.convert_url_to_pagedata(currentUrl);
      this.verbose.log(`Processing page pop! Details:`, data);

      // load the page, and process anything that is listening of this pop event.
      page.load_page(data.page, data.search, data.sub, data.branch);
      this.process_listener(data.page, data);

      // timeout to wait so that listeners have time to finish their tasks.
      setTimeout(() => {
        // reset the url for when we go forward.
        this.current_url = currentUrl;
        this.poppin_jump = false;
      }, 50);
    });
  }

  /**
  * Add a listener to the history so that pages can be loaded as soon as possible.
  * @param {string} key The listener identity, each one must be unique.
  * @param {(data: {branch: string, page: string, search: URLSearchParams, sub: string}) => void} callback What to call upon this listener being triggered
  */
  add_listener(key, callback) {
    this.listeners.set(key, callback);
  }

  /**
   * Checks if the provided data represents a new unique page compared to current history state
   * @param {{branch: string, page: string, search: string, sub: string}} new_data The incoming page data to compare
   * @returns {boolean} True if this represents a new unique page state
   */
  is_new_page(new_data) {
    this.verbose.log(`rabbit?: ${this.poppin_jump}`);
    const url_to_compare = this.poppin_jump ? this.current_url : new URL(window.location);
    const compare_data = this.convert_url_to_pagedata(url_to_compare);
    this.verbose.log(`customHistory.is_new_page: Comparing:`, new_data, `with:`, compare_data);
    this.verbose.log(`results:
new_data.branch != compare_data?.branch: ${new_data.branch != compare_data?.branch}
new_data.page !== compare_data?.page: ${new_data.page !== compare_data?.page}
this.current_url === null: ${this.current_url === null}`);
    return this.current_url === null ||
      new_data.branch != compare_data?.branch ||
      new_data.page != compare_data?.page;
  }

  /**
   * Checks if the new page data represents an important change from the current state
   * that would require a new history entry.
   * @param {{branch: string, page: string, search: URLSearchParams, sub: string}} new_data The incoming page data to compare
   * @returns {boolean} True if this represents an important change requiring a new history entry
   */
  is_important_change(new_data) {
    const url_to_compare = this.poppin_jump ? this.current_url : new URL(window.location);
    const compare_data = this.convert_url_to_pagedata(url_to_compare);
    return this.is_new_page(new_data) ||
      new_data.search != compare_data?.search ||
      (new_data.sub && !compare_data?.sub) ||
      (!new_data.sub && compare_data?.sub);
  }

  /**
     * Checks if the new page data represents exactly the same page as the current state
     * @param {{branch: string, page: string, search: URLSearchParams, sub: string}} new_data The incoming page data to compare
     * @returns {boolean} True if the new data represents the same page
     */
  are_same_page(new_data) {
    const url_to_compare = this.poppin_jump ? this.current_url : new URL(window.location);
    const compare_data = this.convert_url_to_pagedata(url_to_compare);
    this.verbose.log(`Same page?:
new_data.branch == compare_data?.branch: ${new_data.branch == compare_data?.branch}
new_data.page == compare_data?.page: ${new_data.page == compare_data?.page}
new_data.sub == compare_data?.sub: ${new_data.sub == compare_data?.sub}
new_data.search == compare_data?.search: ${new_data.search.toString() == compare_data?.search.toString()}`);
    return new_data.branch == compare_data?.branch &&
      new_data.page == compare_data?.page &&
      new_data.sub == compare_data?.sub &&
      new_data.search.toString() == compare_data?.search.toString();
  }

  /**
   * Process a listener callback for a given key with page data
   * @param {string} key The listener identifier to process
   * @param {{branch: string, page: string, search: URLSearchParams, sub: string}} data The page data to pass to the listener
   */
  process_listener(key, data) {
    // check for any listeners
    const callback = this.listeners.get(key);
    if (callback !== undefined) {
      // call any callback functions they might have
      this.verbose.log(`Calling ${callback.name} for ${key} with data:`, data);
      return callback(data);
    }
    this.verbose.warn(`Failed to find ${key} in customHistory.listeners`);
  }

  /**
  * Store a page in history. Will compare the current store state data to see if we need to push or replace.
  * @param {URL} url The url to go to
  */
  store_page(url) {
    if (this.poppin_jump) {
      // we are processing the popped state here. Affecting the UrL is not necessary.
      return;
    }

    this.verbose.trace(`Store message trace output.`);
    const new_data = this.convert_url_to_pagedata(url);

    // same page, hence probably some kind of history stuff. No need to worry about it.
    const same = this.are_same_page(new_data);
    if (same) {
      this.verbose.log(`Attempting to store same that we are already on, skipping.`);
      return;
    }

    // checks if the page or URL query parameters are different, or if sub (hash) section is being added for the first time
    const requires_push = this.is_important_change(new_data);

    // remove last / from url.href (this cases too many issues...);
    url.href = url.href.replace(/\/$/, '');

    this.verbose.log(`${requires_push ? 'Storing' : 'Replacing'} page: ${url.href} with data:`, new_data);
    this.current_url = url;
    history[requires_push ? 'pushState' : 'replaceState'](null, "", url);
  }

  /**
  * Convert page data to a URL object (opposite of convert_url_to_pagedata)
  * @param {{branch: string, page: string, search: URLSearchParams, sub: string}} data The page data to convert
  * @returns {URL} A URL object representing the page data
  */
  convert_pagedata_to_url(data) {
    const branch = data.branch == '' ? '' : `Branches/${data.branch}/`
    const search_str = data.search.toString().length > 0 ? `?${data.search.toString()}` : '';
    return new URL(`${page.get_current_page_root()}/${branch}${data.page}${search_str}${data.sub}`);
  }

  /**
  * Convert a URL object to page data (opposite of convert_pagedata_to_url)
  * @param {URL} url The URL object to convert
  * @returns {{branch: string, page: string, search: URLSearchParams, sub: string}} The URL's page data
  */
  convert_url_to_pagedata(url) {
    return {
      branch: page.get_branch_from_url(url),
      page: page.get_subpage_from_url(url),
      search: url.searchParams,
      sub: url.hash
    };
  }
}

const loader = new Loader();
const page = new Page();
const script = new Script();
const customHistory = new CustomHistory();

page.load_page_from_url();

export { loader, page, script, customHistory };
