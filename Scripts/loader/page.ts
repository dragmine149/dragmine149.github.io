import { Verbose } from "../verbose.mjs";
import { customHistory } from './customHistory';
import { loader, RETURN_TYPE } from "./loader";
import * as url_functions from './url_functions';
import { modules } from "../../Modules/modules";

class Page {
  /**
  * The cache of the elements
  * This would normally not be needed, but some scripts relay on elements to save code.
  * Without cache, elements might not load correctly as they are referencing things that exist but aren't visible.
  */
  document_cache: Map<string, HTMLElement>;
  verbose: Verbose;
  finish_loaded: Map<string, () => void>;

  constructor() {
    this.document_cache = new Map();
    this.finish_loaded = new Map();
    this.verbose = new Verbose("Loader_Page", "#f01e94");
    customHistory.add_listener("page", (data) => this.load_page(data.page, data.search, data.sub, data.branch));
  }

  addFinishListener(page: string, callback: () => void) {
    this.finish_loaded.set(page, callback);
  }

  /**
  * Load page contents into the page itself.
  * @param {URL} url The url of the page to load
  * @param {HTMLElement} data The data of the page to load
  */
  load_page_contents(url: URL, data: HTMLElement) {
    document.getElementById("content")?.replaceWith(data);
    const title_elm = document.getElementsByTagName('title').item(0);

    // set the page title to the one provided in the page, or the actually page "category" per se.
    const new_title = document.getElementById("content")?.getElementsByTagName('pageTitle').item(0) as HTMLElement;
    if (title_elm != null) {
      title_elm.innerText = new_title ? new_title.innerText : url_functions.get_subpage_from_url(url);
    }

    customHistory.store_page(url);
  }

  /**
    * Loads a page in the form of website.com/page?search#sub
    * @param page The page to load (e.g. /Blog)
    * @param search Search parameters (e.g. ?blog=2024-01-02)
    * @param sub Page reference (e.g. #some_heading)
    * @param branch_name The branch of the website to get the data from. Default to no branch
    */
  async load_page(page: string, search: URLSearchParams | null = null, sub: string = '', branch_name: string = '') {
    this.verbose.log(`Attempting to load page with data:`, { page, search, sub, branch_name });

    // sort out the data so that they are either empty or in a special form.
    let branch = branch_name == '' ? '' : `Branches/${branch_name}/`
    page = page.includes('main_page') ? '' : page;
    sub = sub == '' ? '' : `#${sub}`;
    search = (search == null || search.size == 0) ? new URLSearchParams() : search;

    // check to see if the page change is too big to reload everything
    const looking_data = {
      branch: branch_name,
      page: page,
      search: search,
      sub: sub
    };
    const destination_url = customHistory.convert_pagedata_to_url(looking_data);
    // Attempts to store the page and if we can't call the scripts and continue.
    if (!customHistory.page_check(destination_url)) {
      this.verbose.log(`Cancelling page load as changes aren't big enough to warrant change`);
      return;
    }

    const file = `${url_functions.get_current_page_root()}/${branch}${page}${page.endsWith('.html') ? '' : '/index.html'}`;
    // check the cache for the element
    let data = this.document_cache.get(file);

    // load from server and make a new cache if it doesn't exist.
    if (data == undefined) {
      const doc_data = await loader.get_contents_from_server(file, RETURN_TYPE.document) as Document | undefined;
      let temp_data = doc_data?.getElementById("content");
      if (temp_data == null || temp_data == undefined) {
        this.verbose.error(`Invalid file from server: ${file}`);
        return;
      }
      data = temp_data;
      this.document_cache.set(file, data);
    }

    // load the module data before loading the script data. modules are designed to have priority as they are used in most places.
    await modules.load_modules_from_dom(data);

    this.verbose.log(`New destination: ${destination_url} ({branch: ${branch}, page: ${page}, search: ${search}, sub: ${sub}})`);
    this.load_page_contents(destination_url, data);
    customHistory.store_page(destination_url); // event store the page after stuff has loaded.
    let func = this.finish_loaded.get(page);
    if (typeof func === 'function') func();
  }

  /**
  * Designed to be called once upon loading the websie.
  * Calls `load_page` after decoding the url that has loaded this site.
  */
  load_page_from_url(url?: URL) {
    if (url == undefined) {
      url = url_functions.get_url();
    }
    this.verbose.log(`Attempting to load page from url: `, url);

    const branch = url_functions.get_branch_from_url(url);
    let page = url_functions.get_subpage_from_url(url);
    this.verbose.log(`page from url: ${page}`);

    let load = url.searchParams.get("load");
    // load the page from the url provided if we have said url.
    if (load != null) {
      page = load;
      url.searchParams.delete('load');
    }

    const search = url.searchParams; // search is nice and easily separated
    const sub = url.hash;

    this.load_page(page, search, sub, branch);
  }

  //   /**
  //     * Creates a URLSearchParams object from a variable number of search parameter objects
  //     * @param {...Object} params - Objects containing search parameter key-value pairs
  //     * @returns {URLSearchParams} The combined search parameters
  //     */
  //   generate_search_params(...params) {
  //     const search_params = new URLSearchParams();

  //     for (const param_obj of params) {
  //       Object.entries(param_obj).forEach(([key, value]) => {
  //         search_params.append(key, value);
  //       });
  //     }

  //     return search_params;
  //   }
}

let page = new Page();
page.load_page_from_url();

export { page };
