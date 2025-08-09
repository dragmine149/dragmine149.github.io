import { Verbose } from "../verbose.mjs";
import { DragStorage } from "../storage";
import * as url_functions from './url_functions';
import { tryCatch } from "../trycatch";

declare function ui(element: string): void;

enum RETURN_TYPE {
  text, json, document
};


class Loader {
  cache: Map<string, any>;
  verbose: Verbose;
  storage: DragStorage;

  /**
  * Create a new loader class to load content from the server.
  */
  constructor() {
    this.cache = new Map();
    this.verbose = new Verbose("Loader_Loader", "#edd29e");
    this.storage = new DragStorage("loader");
  }

  /**
  * Show a warning message to the user when something goes wrong
  * @param message The message to display
  */
  #warn_load(message: string) {
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

  #parse_url(url: string | URL) {
    let str_url = url.toString();
    if (str_url.endsWith("/")) str_url.substring(-1);
    if (str_url.startsWith(url_functions.get_current_page_root())) {
      // might be a bit extra work removing the branches part here, but makes it easier for later.
      str_url = str_url.replace(/Branches\/.*?\//, '');
    }
    // console.warn(str_url);
    return str_url;
  }

  /**
  * Get contents from the server
  * @type Type `T` is the return type of RETURN_TYPE.json;
  * @param string_server_url The url on the server to query
  * @param return_type The type of data to return.
  * @returns Returns data based on the return type provided.
  */
  async get_contents_from_server(server_url: string | URL, return_type: RETURN_TYPE = RETURN_TYPE.text) {
    let string_server_url = this.#parse_url(server_url);
    let use_branch = this.storage.getStorage("Branch");

    if (typeof string_server_url !== 'string') {
      this.#warn_load(`server_url must be string or URL (preferred string), got ${typeof string_server_url}`);
      return undefined;
    }

    let branch = use_branch != null ? `/Branches/${use_branch}` : ``;
    string_server_url = `${string_server_url}${branch}`;
    // forceable overwrite the main page with well the main page as the main page is already loaded by the browser.
    string_server_url = string_server_url == 'index.html' ? 'main_page.html' : string_server_url;

    let cache_name = `${string_server_url}-${return_type}`;
    this.verbose.log(`Attempting to get data from '${string_server_url}' with: {'use_branch': ${use_branch}, 'return_type': ${return_type}}`);

    // get the results from cache, always better.
    const stored_data = this.#get_from_cache(cache_name);
    if (stored_data !== undefined) {
      this.verbose.log(`Found cache. Returning early`);
      // we have a cache, hence we don't need to worry about anything else.
      return stored_data;
    }
    this.verbose.log("No cache, forced to fetch");

    // get the result from the server, as we have no cache clue.
    // console.warn(string_server_url);
    let result = await tryCatch(fetch(string_server_url, {
      headers: {
        "Cache-Control": "max-age=86400"
      }, mode: "no-cors"
    }));
    this.verbose.log(result);

    if (result.error) {
      this.verbose.error("Fetch failed: ", result.error);
      this.#warn_load(`Failed to load data from url: ${string_server_url}. Due to reason: ${result.error}`);
      return undefined;
    }
    let data_result = result.data;

    // check to see if we have a result
    if (!data_result.ok) {
      this.verbose.log(`Failed to load data, result:`, result);
      if (use_branch != null) {
        string_server_url = string_server_url.replace(/Branches\/.*?\//, '');
        result = await tryCatch(fetch(string_server_url, {
          headers: {
            "Cache-Control": "max-age=86400"
          }, mode: "no-cors"
        }));
      }
    }
    this.verbose.log(result);

    if (result.error) {
      this.verbose.error("Fetch failed (round 2): ", result.error);
      this.#warn_load(`Failed to load data from url: ${string_server_url}. Due to reason: ${result.error} (round 2)`);
      return undefined;
    }
    data_result = result.data;

    // Yes second check, but sometimes this happens after we've sent another request to the server.
    if (!data_result.ok) {
      // warning message
      this.verbose.log(`Failed to load data, result:`, data_result);
      this.#warn_load(`Failed to load data from url: ${string_server_url} (via: ${data_result.url}).`);
      return undefined;
    }

    // return the apporipate type depending on what is asked of us.
    switch (return_type) {
      case RETURN_TYPE.json:
        return this.#cache_and_return(cache_name, await data_result.json());
      case RETURN_TYPE.document:
      case RETURN_TYPE.text:
      default:
        return this.#cache_and_return(cache_name, await data_result.text());
    }
  }

  /**
  * Cache the results and return the same result
  * @param cache_name The server url that this result is from
  * @param result The results from the server.
  * @returns Returns the original result data provided, or slightly modified depending on the __get_from_cache method.
  */
  #cache_and_return(cache_name: string, result: any): any {
    this.cache.set(cache_name, result);
    return this.#get_from_cache(cache_name);
  }

  /**
  * Get data from the cache and returns it depending on what type it is
  * @param cache_name The name of the cache
  * @returns The resulting data
  */
  #get_from_cache(cache_name: string): any {
    const data = this.cache.get(cache_name);
    if (data === undefined) return undefined;

    const return_type = parseInt(cache_name.charAt(cache_name.length - 1));
    switch (return_type) {
      // document is special (hence this entire function)
      case RETURN_TYPE.document:
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        return doc;

      // the rest we can just do as normal.
      case RETURN_TYPE.json:
        return data;
      case RETURN_TYPE.text:
      default:
        return data as string;
    }
  }
}

const loader = new Loader();

export { loader, ui, RETURN_TYPE }
