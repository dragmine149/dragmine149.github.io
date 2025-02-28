class DragSettings {
  /** @type {Map<string, HTMLElement>} */
  cache;

  /**
  * The page currently visible
  * @type {string}
  */
  currently_viewing;

  /**
  * Default templates to avoid having to use code everywhere to make a complex one.
  * @type {{
    'main': Document
  }}
  */
  templates;

  /**
   * @typedef {(boolean|number)} SettingType
   * @typedef {("bool"|"number")} SettingTypeString
   *
   * @typedef {Object} SettingRangeObject
   * @property {number} lower - The lower bound of the range
   * @property {number} upper - The upper bound of the range
   *
   * @typedef {Object} SettingOptionObject
   * @property {string} description - Description of the setting option
   * @property {(SettingTypeString)} type - Type of the setting value
   * @property {(SettingType)} default - Default value
   * @property {boolean} quick - Whether this is a quick setting
   * @property {(SettingType)} value - The value of the setting
   * @property {SettingRangeObject} [range] - Optional range constraints for number types
   * @property {string} [requires] - Optional dependency requirement
   *
   * @typedef {Object} SettingCategoryObject
   * @property {string} description - Description of the setting category
   * @property {Object.<string, SettingOptionObject>} options - Map of setting options
   */

  /**
   * Settings data structure
   * @type {Object.<string, SettingCategoryObject>}
   */
  data;

  /** Functions to call upon settings being changed
   * @type {Map<string, Function>}
   */
  listeners;

  constructor() {
    /** @type {Verbose} */
    this.verbose = verbose.add_log('Settings', '#f5a97e');
    /** @type {DragStorage} */
    this.settings = new DragStorage("setting");
    // this.data = fetch("Scripts/Settings/Settings.json").then((response) => response.json().then((r) => r));
    // this.data = fetch("Scripts/Settings/Settings.json").then((r) => this.verbose.log(r));
    this.cache = new Map();
    this.listeners = new Map();

    this.data = {};
    this.settings.listStorage().forEach((item) => {
      let [category, key] = item.split("-");

      this.data[category] = { options: { [key]: {} } };
      this.data[category].options[key].value = this.get_setting(category, key);
    })

    this.__initial_load();
  }

  async __initial_load() {
    // get settings from server
    this.data = await loader.get_contents_from_server("Scripts/Settings/settings.json", true, loader.RETURN_TYPE.json);

    // for all possible settings
    Object.keys(this.data).forEach((key) => {
      if (key.startsWith("$")) return;

      // make a category for everything
      this.__make_category(key);
      Object.entries(this.data[key].options).forEach((options) => {
        if (options[0].startsWith("$")) return;
        this.verbose.info(`Loading ${key}-${options[0]}`);
        // add to quick, if quick
        if (options[1].quick) this.__add_quick_elm(key, options[0]);
        // set the data of the setting
        this.data[key].options[options[0]].value = this.get_setting(key, options[0]);
      });
    });

    // then, less important, but load the templates.
    await this.__load_templates();
  }

  __make_category(category) {
    const elements = document.getElementById("setting-key");
    const button = document.createElement("button");
    button.innerText = category;
    button.addEventListener('click', (_) => this.__load_ui(category));
    elements.appendChild(button);
  }

  async __load_templates() {
    this.verbose.log("Loading templates...");
    this.templates = {
      'main': await loader.get_contents_from_server("Scripts/Settings/templates/main.html", true, loader.RETURN_TYPE.document),
    };
  }

  /**
   * Create a ui element for a setting.
   * @param {string} category The category of the setting.
   * @param {string} setting The key of the setting.
   */
  __create_ui_value(category, setting) {
    /** @type {HTMLElement} */
    let value = document.getElementById("setting-value")?.getElementsByClassName('values')?.item(0);
    if (value == undefined) {
      this.verbose.error("Failed to find setting-value element");
      return;
    }

    // check to see if in cache, if so add and ignore the rest.
    /** @type {HTMLElement} */
    let cached = this.cache.get(`${category}-${setting}`);
    if (cached) {
      value.appendChild(cached);
      return;
    }

    /** @type {SettingOptionObject} */
    let details = this.data[category].options[setting];

    /** @type {HTMLElement} */
    let node = this.templates.main.querySelector('[tag="main"]').cloneNode(true);

    /** @type {HTMLElement} */
    let title = node.querySelector('[tag="title"]');
    title.innerText = capitalise(setting);

    /** @type {HTMLElement} */
    let description = node.querySelector('[tag="description"]');
    description.innerText = details.description;

    /** @type {HTMLInputElement} */
    // process setting the default value of the input based off data provided
    let input = node.querySelector('[tag="input"]');
    input.value = details.value;
    switch (details.type) {
      case 'number':
        input.type = 'range';
        input.min = details.range?.lower;
        input.max = details.range?.upper;
        input.value = details.value;
        break;
      case 'bool':
        input.type = 'checkbox';
        input.checked = details.value;
        break;
      case 'string':
      default:
        input.type = 'text';
        input.value = details.value;
    }

    // listen and wait for a change
    input.addEventListener('change', (_) => {
      let value;
      switch (details.type) {
        case 'bool':
          value = input.checked;
          break;
        default:
          value = input.value;
      }
      this.set_setting(category, setting, value);
    });

    // listen and wait for default reset
    let default_node = node.querySelector('[tag="default"]');
    default_node.addEventListener('click', (_) => {
      switch (details.type) {
        case 'bool':
          input.checked = details.default;
          break;
        default:
          input.value = details.default;
      }
    });

    // add to cache and to ui.
    this.cache.set(`${category}-${setting}`, node);
    value.appendChild(node);
  }

  /**
  * Hides or shows an object based on if the required object is enabled or not
  * @param {string} category The category of the setting
  * @param {string} setting The setting in the category
  */
  __required(category, setting) {
    let required = this.data[category].options[setting].requires;
    // Early return if the required dooes not exist.
    if (required == undefined) return;

    // split the details up and get the setting
    let required_details = required.split("-");
    let parent_enabled = this.get_setting(required_details[0], required_details[1]);
    this.verbose.log(`Checking required for: `, `${category}-${setting}`);
    this.verbose.info(`Parent: `, parent_enabled);
    let node = this.cache.get(`${category}-${setting}`);
    this.verbose.log(`Node: `, node);
    if (node == undefined) return;

    // hide or show the node based on the parent's enabled state
    node.hidden = !parent_enabled;
  }

  /**
  * Go through all the settings in a particular category.
  */
  __update_required(category) {
    Object.keys(this.data[category].options).forEach((setting) => {
      if (setting.startsWith("$")) return;
      if (this.data[category].options[setting].requires) {
        this.__required(category, setting);
      }
    });
  }

  /**
  * Load the settings ui
  * @param {string} category The category of the setting to load.
  */
  __load_ui(category) {
    // check to see if exists, which would be a very big issue if it didn't...
    /** @type {HTMLElement} */
    let value = document.getElementById("setting-value");
    if (value == undefined) {
      this.verbose.error(`Element with id "setting-value" not found.`);
      return;
    }

    // set title, description, options, all that stuff
    let title = value.getElementsByClassName('title').item(0);
    title.innerHTML = capitalise(category);

    let description = value.getElementsByClassName('description').item(0);
    description.innerHTML = this.data[category].description;

    // clearing the innerhtml to quickly clean out the old stuff.
    // probably a nicer alternative, but whatever.
    value.getElementsByClassName('values').item(0).innerHTML = '';

    Object.keys(this.data[category].options).forEach((option) => {
      this.__create_ui_value(category, option);
      this.__required(category, option);
    });
  }

  __add_quick_elm(category, setting) {
    this.verbose.log(`Adding quick element: ${category}-${setting}`);
    this.verbose.log('TODO');
  }

  add_listener(category, setting, callback) {
    this.listeners.set(`${category}-${setting}`, callback);
  }
  remove_listener(category, setting) {
    this.listeners.delete(`${category}-${setting}`);
  }

  /**
  * Sets any setting to the provided value
  * @param {string} category The setting category
  * @param {string} setting The name of the setting
  * @param {SettingType} value The value to store. (will be saved as string due to localstorage)
  */
  set_setting(category, setting, value) {
    this.verbose.log(`Saving setting: ${category}-${setting} (setting to ${value})`);
    this.settings.setStorage(`${category}-${setting}`, value);
    this.listeners.get(`${category}-${setting}`)?.(value);
    this.__update_required(category);
  }

  /**
  * Get any setting and returns it as the proper format.
  * @param {string} category The setting category
  * @param {string} setting The name of the setting
  * @returns {SettingType} The result of the setting, in a format befiting of the setting where possible.
  */
  get_setting(category, setting) {
    const value = this.settings.getStorage(`${category}-${setting}`);

    if (value === null || value === undefined) {
      if (this.data[category].options[setting].default) {
        return this.data[category].options[setting].default;
      }

      // if type exists find default value
      switch (this.data[category].options[setting].type) {
        case 'bool':
          return false;
        case 'number':
          return 0;
        case 'string':
          return '';
        default:
          return null;
      }
    }

    // Convert boolean strings
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    // Try parsing as number
    const number = Number(value);
    if (!isNaN(number)) return number;

    // Try parsing as JSON object/array
    try {
      return JSON.parse(value);
    } catch (e) {
      // If not JSON parseable, return as string
      return value;
    }
  }

  /**
  * To show or to hide the settings
  * @param {boolean} state The state of which to put the settings menu into
  */
  visible(state) {
    if (state === undefined || state === null) {
      state = document.getElementById("big-settings").hidden;
    }
    if (typeof state !== 'boolean') {
      this.verbose.warn('Settings visibility value must be boolean');
      return;
    }

    // flip state here otherwise it's going to be conufsing in the actual code.
    document.getElementById("big-settings").hidden = !state;
  }
}

const settings = new DragSettings();
