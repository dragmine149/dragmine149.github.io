/**
 * Class to manage loading of modules and their dependencies
 */
class Modules {
  __modules = {
    "markdown": {
      "main": "Modules/markdown.js",
      "js": [
        "https://cdn.jsdelivr.net/npm/marked@15.0.7/lib/marked.umd.min.js",
        "https://cdn.jsdelivr.net/npm/marked-footnote@1.2.4/dist/index.umd.min.js",
        "https://cdn.jsdelivr.net/npm/marked-custom-heading-id@2.0.11/lib/index.umd.min.js",
        "https://cdn.jsdelivr.net/npm/marked-highlight@2.2.1/lib/index.umd.min.js",
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
    },
  };

  constructor() {
    Object.freeze(this.__modules);
  }

  /**
   * Gets the modules container node
   * @returns {HTMLElement} The modules container element
   * @private
   */
  __get_node() {
    return document.getElementById("scripts").getElementsByClassName("modules").item(0);
  }

  /**
   * Gets a module elements, create one if one doesn't already exists.
   * @param {string} module_name - Name of the module
   * @returns {HTMLElement} Module container element
   * @private
   */
  __get_module(module_name) {
    const children = this.__get_node().children;
    const child_count = children.length;

    // for all children
    for (let child_id = 0; child_id < child_count; child_id++) {
      const name = children.item(child_id).attributes.name?.value;
      // check if someone with the name we're looking for exists
      if (name == module_name) {
        return children.item(child_id);
      }
    }

    // otherwise, create a new module
    const elm = document.createElement("div");
    elm.setAttribute("name", module_name);
    // add
    this.__get_node().appendChild(elm);
    // and return
    return elm;
  }

  /**
   * Load a module into the page, if it isn't already loaded
   * @param {string} module The name of the module to load
   */
  load_module(module) {
    const elm = this.__get_module(module);

    /**
    * @type {{main: string, js: string[], css: string[]}} The data of the module
    */
    const data = this.__modules[module];

    // filter out scripts that aren't loaded yet.
    // if we have more loaded in that category, just leave them be.
    const scripts = Array.from(elm.getElementsByTagName("script"));
    const js = data.js.filter(src => !scripts.some(s => s.getAttribute("src") === src));

    console.log(`Detected missing scripts: [${js.join(", ")}]`);

    // load those other scripts
    for (const missing in js) {
      console.log(`Adding missing script: ${js.at(missing)}`);
      const script = document.createElement("script");
      script.src = js.at(missing);
      elm.appendChild(script);
    }

    // same as above, but css style.
    const styles = Array.from(elm.getElementsByTagName("link"));
    const css = data.css.filter(src => !styles.some(s => s.getAttribute("href") === src));

    console.log(`Detected missing styles: [${css.join(", ")}]`);

    for (const missing in css) {
      console.log(`Adding missing style: ${css.at(missing)}`);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = css.at(missing);
      elm.appendChild(link);
    }

    // load the main one last, as due to it being the main one it might require stuff from the other scripts.
    const main_loaded = scripts.some((s) => s.getAttribute("src") === data.main);
    if (!main_loaded) {
      console.log(`Adding missing main script (${data.main})`);
      const script = document.createElement("script");
      script.src = data.main;
      elm.appendChild(script);
    }
  }

  /**
  * Load modules from a document element
  * @param {HTMLElement} elm The element to get the data from
  */
  load_modules_from_dom(elm) {
    const elements = elm.getElementsByTagName("module");
    for (const elm of elements) {
      elm.hidden = true;
      this.load_module(elm.innerText);
    }
  }
}

const modules = new Modules();

export { modules }
