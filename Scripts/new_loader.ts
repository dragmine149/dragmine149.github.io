import { Verbose } from "./verbose.mjs";


class Script {
  scripts: HTMLElement | null;
  verbose: Verbose;

  constructor() {
    this.scripts = this.__reload_self();
    this.verbose = new Verbose("Loader_Script", "#a9f831");
  }

  __reload_self() {
    if (this.scripts !== null && this.scripts !== undefined) {
      return null;
    }
    return document.getElementById("scripts");
  }

  /**
  * Checks to see if we have already loaded this script before
  * @param src The source of the script to check for
  * @returns Have we or have we not
  */
  __has_loaded(src: string | null) {
    return this.scripts?.querySelector(`script[src="${src}"]`) != null;
  }

  /**
    * Load the scripts for a page.
    * @param page_name - The name of the page, won't load stuff it's already loaded.
    * @param page_data - The script data to load.
    */
  load_scripts(category: string, page_data: HTMLElement) {
    this.scripts = this.__reload_self();
    if (page_data == null) {
      this.verbose.error(`Failed to load page with category '${category}' as there was no page data...`);
      return;
    }

    // check to see if a category exists, if so call that instead of trying to add new scripts.
    // the page data should be cached anyway, and if it's not well tough.
    if (this.scripts?.querySelector(`script[category="${category}"]`) !== null) {
      this.verbose.log(`Found script with category: ${category}, skipping...`);
      this.call_defaults_in_category(category);
      return;
    }

    // Find the scripts in the page
    const new_scripts = page_data.getElementsByTagName("script");
    for (let script_id = 0; script_id < new_scripts.length; script_id++) {
      const script = new_scripts.item(script_id);
      if (script == null) {
        continue;
      }

      this.verbose.log(`Attempting to add new script: ${script.getAttribute("src")}`);
      if (script.src && this.__has_loaded(script.getAttribute("src"))) {
        this.verbose.warn(`Found already loaded script, continuing... (category was not picked up)`);
        this.verbose.trace();
        // this should RARLEY be hit, but it's to avoid cases like "redeclaration of variable", etc..
        continue;
      }

      // Create a new script element and copy everything across.
      const new_script = document.createElement("script");
      for (const attribute of script.getAttributeNames()) {
        new_script.setAttribute(attribute, script.getAttribute(attribute) as string);
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
  * @param category The category to call the scripts in.
  */
  call_defaults_in_category(category: string) {
    // this.verbose.log(`Calling defaults on scripts of category: ${category}`);
    this.verbose.log(`NOT!! !! !! Calling defaults on scripts of category: ${category}`);

    // filter out all of those in difference categories
    // const children = Array.from(this.scripts.children).filter(child => child.getAttribute("category") === category);
    // for (let script_id = 0; script_id < children.length; script_id++) {
    //   // test function to see if it exists
    //   const func_name = `${category}_default_${script_id}`;
    //   if (typeof window[func_name] !== "function") {
    //     continue;
    //   }
    //   // and call it.
    //   this.verbose.log(`Calling default function: ${func_name}`);
    //   window[func_name]();
    // }
  }
}


const script = new Script();

export { script };
