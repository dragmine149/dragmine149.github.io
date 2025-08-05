import { Verbose } from "../verbose.mjs";
import * as url_functions from './url_functions';

interface URLData {
  branch: string,
  page: string,
  search?: URLSearchParams,
  sub?: string,
}

type ListenerCallback = (data: URLData) => void;

class CustomHistory {
  listeners: Map<String, ListenerCallback>;
  /**
   * A value to determine if we are processing the 'popstate' event.
   * During this time, some other checks need to be modified or skipped to avoid messing up the history.
   */
  poppin_jump: boolean = false;
  // changing the URL happens before we're finished with it sometimes...
  current_url: URL;
  verbose: Verbose;

  constructor() {
    this.listeners = new Map();
    this.verbose = new Verbose("Loader_History", "#a1b2c3");
    this.current_url = url_functions.get_url();

    // the event handler for dealing with browser.back and browser.forward
    window.addEventListener('popstate', () => {
      if (this.poppin_jump) return;
      this.poppin_jump = true;

      // get the current details.
      const data = this.convert_url_to_pagedata();
      this.verbose.log(`Processing page pop! Details:`, data);

      // load the page, and process anything that is listening of this pop event.
      // always process the page listener no matter what.
      this.process_listener("page", data);
      this.process_listener(data.page, data);

      // timeout to wait so that listeners have time to finish their tasks.
      setTimeout(() => {
        // reset the url for when we go forward.
        this.current_url = url_functions.get_url();
        this.poppin_jump = false;
      }, 50);
    });
  }

  /**
  * Add a listener to the history so that pages can be loaded as soon as possible.
  * @param key The listener identity, each one must be unique.
  * @param callback What to call upon this listener being triggered
  */
  add_listener(key: string, callback: ListenerCallback) {
    this.listeners.set(key, callback);
  }

  /**
   * Checks if the provided data represents a new unique page compared to current history state
   * @param new_data The incoming page data to compare
   * @returns True if this represents a new unique page state
   */
  #is_new_page(new_data: URLData) {
    const compare_data = this.convert_url_to_pagedata();
    this.verbose.log(`customHistory.is_new_page: Comparing:`, new_data, `with:`, compare_data);
    this.verbose.log(`results:`, {
      "branch": new_data.branch !== compare_data.branch,
      "page": new_data.page !== compare_data.page,
      "url": this.current_url === null
    });
    return this.current_url === null ||
      new_data.branch != compare_data?.branch ||
      new_data.page != compare_data?.page;
  }

  /**
   * Checks if the new page data represents an important change from the current state
   * that would require a new history entry.
   * @param new_data The incoming page data to compare
   * @returns True if this represents an important change requiring a new history entry
   */
  #is_important_change(new_data: URLData) {
    const compare_data = this.convert_url_to_pagedata();
    return this.#is_new_page(new_data) ||
      new_data.search != compare_data?.search ||
      (new_data.sub && !compare_data?.sub) ||
      (!new_data.sub && compare_data?.sub);
  }

  /**
     * Checks if the new page data represents exactly the same page as the current state
     * @param new_data The incoming page data to compare
     * @returns True if the new data represents the same page
     */
  #are_same_page(new_data: URLData) {
    const compare_data = this.convert_url_to_pagedata();
    this.verbose.debug("Same page?:", {
      "branch": new_data.branch == compare_data.branch,
      "page": new_data.page == compare_data.page,
      "sub": new_data.sub == compare_data.sub,
      "search": new_data.search == compare_data.search
    });
    return new_data.branch == compare_data?.branch &&
      new_data.page == compare_data?.page &&
      new_data.sub == compare_data?.sub &&
      new_data.search?.toString() == compare_data.search?.toString();
  }

  /**
   * Process a listener callback for a given key with page data
   * @param key The listener identifier to process
   * @param data The page data to pass to the listener
   */
  process_listener(key: string, data: URLData) {
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
  * @param url The url to go to
  * @return If the page was succesffully stored or not.
  */
  store_page(url: URL) {
    if (this.poppin_jump) {
      // we are processing the popped state here. Affecting the UrL is not necessary.
      return false;
    }

    this.verbose.trace(`Store message trace output.`);
    const new_data = this.convert_url_to_pagedata(url);

    // same page, hence probably some kind of history stuff. No need to worry about it.
    if (this.#are_same_page(new_data)) {
      this.verbose.log(`Attempting to store same that we are already on, skipping.`);
      return false;
    }

    // checks if the page or URL query parameters are different, or if sub (hash) section is being added for the first time
    const requires_push = this.#is_important_change(new_data);

    // remove last / from url.href (this cases too many issues...);
    url.href = url.href.replace(/\/$/, '');

    this.verbose.log(`${requires_push ? 'Storing' : 'Replacing'} page: ${url.href} with data:`, new_data);
    this.current_url = url;
    history[requires_push ? 'pushState' : 'replaceState'](null, "", url);
    return requires_push;
  }

  /**
  * Convert page data to a URL object (opposite of convert_url_to_pagedata)
  * @param data The page data to convert
  * @returns A URL object representing the page data
  */
  convert_pagedata_to_url(data: URLData) {
    const branch = data.branch == '' ? '' : `Branches/${data.branch}/`
    const search_str = data.search == null ? '' : data.search.toString().length > 0 ? `?${data.search.toString()}` : '';
    return new URL(`${url_functions.get_current_page_root()}/${branch}${data.page}${search_str}${data.sub}`);
  }

  /**
  * Convert a URL object to page data (opposite of convert_pagedata_to_url)
  * @param url The URL object to convert. Default to the current url.
  * @returns The URL's page data
  */
  convert_url_to_pagedata(url?: URL): URLData {
    this.verbose.log(`rabbit?: ${this.poppin_jump}`);
    if (url == undefined) url = this.poppin_jump ? this.current_url : url_functions.get_url();
    return {
      branch: url_functions.get_branch_from_url(url),
      page: url_functions.get_subpage_from_url(url),
      search: url.searchParams,
      sub: url.hash
    };
  }
}

let customHistory = new CustomHistory();

export { customHistory };
