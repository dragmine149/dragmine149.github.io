type moduleInfo = {
  /** The main important function to load at the end. */
  main?: string;
  /** A list of js functions to load in order of priority. */
  js?: string[];
  /** A list of css files to load to make stuff pretty. */
  css?: string[];
}

class Modules {
  #modules: {
    [key: string]: moduleInfo;
  }
  loaded_modules: Map<string, typeof import('./empty')>;

  constructor() {
    this.loaded_modules = new Map();
    this.#modules = {
      "markdown": {
        "js": [
          "Blog/marked/markedLocalTime.js",
          "Blog/marked/markedImprovedImage.js",
          "Blog/marked/markedCenterText.js",
          "Blog/marked/markedLocalLink.js",
          // highlight.js assets required for marked-highlight
          "Assets/highlight/highlight.min.js"
        ],
        "css": [
          "Assets/highlight/styles/tokyo-night-dark.min.css"
        ]
      }
    };

    Object.freeze(this.#modules);
  }

  /**
   * Attempts to load a module.
   * @param module The module to load
   * @returns That module information.
   */
  async #import_module(module: string): Promise<typeof import('./empty')> {
    // Probably doesn't do much, but return it anyway.
    let loaded = this.loaded_modules.get(module);
    if (loaded != undefined) return loaded;

    switch (module) {
      case "blog": return await import('../Blog/blog');
      case "projects": return await import('../Projects/projects');
      default: return await import('./empty');
    }
  }

  /**
   * Gets the modules container node
   * @returns The modules container element
   */
  #get_node() {
    return document.getElementById("scripts")?.getElementsByClassName("modules").item(0) as HTMLElement;
  }

  /**
   * Gets a module elements, create one if one doesn't already exists.
   * @param moduleName - Name of the module
   * @returns Module container element
   */
  #get_module(moduleName: string) {
    let node = this.#get_node();
    let children = node.children;
    let child_count = children.length;

    // for all children
    for (let child_id = 0; child_id < child_count; child_id++) {
      let child = children.item(child_id);
      let name = child?.getAttribute("name");
      // check if someone with the name we're looking for exists
      if (name == moduleName) {
        return child as HTMLDivElement;
      }
    }

    // otherwise, create a new module
    const elm = document.createElement("div");
    elm.setAttribute("name", moduleName);
    // add
    node.appendChild(elm);
    // and return
    return elm;
  }

  #load_items(elm: HTMLDivElement, data: string[], item_type: string, attribute: string, callback: (elm: HTMLElement, item: string) => void) {
    let array = Array.from(elm.getElementsByTagName(item_type));
    let filtered = data.filter(atr => !array.some(a => a.getAttribute(attribute) === atr));

    console.log(`Detected missing ${item_type}:`, array);
    filtered.forEach((item) => {
      console.log(`Adding missing ${item_type}: ${item}`);
      let child = document.createElement(item_type);
      callback(child, item);
      elm.appendChild(child);
    });
  }

  /**
   * Load a module into the page, if it isn't already loaded
   * @param module The name of the module to load
   */
  async load_module(module: string) {
    // dynamic loading modules are unique in their own way.
    // hence we can kinda forget about the whole script stuff.
    let dynamic = await this.#import_module(module);
    this.loaded_modules.set(module, dynamic);
    if (dynamic.initialise()) return;

    const elm = this.#get_module(module);

    /** The data of the module */
    const data: moduleInfo | undefined = this.#modules[module];
    if (data == undefined) return;

    // filter out scripts that aren't loaded yet.
    // if we have more loaded in that category, just leave them be.
    this.#load_items(elm, data.js || [], "script", "src", (child, item) => {
      (child as HTMLScriptElement).src = item;
    });
    // same as above, but css style.
    this.#load_items(elm, data.css || [], "link", "href", (child, item) => {
      (child as HTMLLinkElement).href = item;
      (child as HTMLLinkElement).rel = "stylesheet";
    });

    // load the main one last, as due to it being the main one it might require stuff from the other scripts.
    this.#load_items(elm, data.main ? [data.main] : [], "script", "src", (child, item) => {
      (child as HTMLScriptElement).src = item;
    });
  }

  /**
  * Load modules from a document element
  * @param elm The element to get the data from
  */
  async load_modules_from_dom(elm: HTMLElement) {
    const elements = elm.getElementsByTagName("module") as HTMLCollectionOf<HTMLElement>;
    for (const elm of elements) {
      elm.hidden = true;
      await this.load_module(elm.innerText);
    }
  }
}

let modules = new Modules();

export { modules };
