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
    'quick': Document
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
   * @typedef {Object.<string, boolean|number>} SettingRequiresObject
   * @description An object where keys are setting identifiers and values are required states (boolean or number)
   *
   * @typedef {Object} SettingOptionObject
   * @property {string} description - Description of the setting option
   * @property {(SettingTypeString)} type - Type of the setting value
   * @property {(SettingType)} default - Default value
   * @property {boolean} quick - Whether this is a quick setting
   * @property {(SettingType)} value - The value of the setting
   * @property {SettingRangeObject} [range] - Optional range constraints for number types
   * @property {SettingRequiresObject} [requires] - Optional dependency requirement
   * @property {string} [disabled] - Optional none visibility requirement.
   * @property {string} [icon] - Optional icon, requires quick to be true though.
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
    this.verbose = new Verbose('Settings', '#f5a97e');
    /** @type {DragStorage} */
    this.settings = new DragStorage("setting");
    this.cache = new Map();
    this.listeners = new Map();

    // load the settings from local storage as much as we can.
    // this allows the website to load to a semi user set up state without having all the data yet.
    this.data = {};
    this.settings.listStorage().forEach((item) => {
      let [category, key] = item.split("-");

      this.data[category] = { options: { [key]: {} } };
      this.data[category].options[key].value = this.get_setting(category, key);
      this.__call_listener(category, key, this.data[category].options[key].value);
    })

    this.__initial_load();
  }

  /**
  * Stuff that happens outside of the constructor due to async required.
  */
  async __initial_load() {
    // get settings from server
    this.data = await loader.get_contents_from_server("Scripts/Settings/settings.json", true, loader.RETURN_TYPE.json);

    // templates are tempalates, although should not be as important sometimes they are.
    await this.__load_templates();

    // for all possible settings
    Object.keys(this.data).forEach((key) => {
      if (key.startsWith("$")) return;

      // make a category for everything
      this.__make_category(key);
      Object.entries(this.data[key].options).forEach((options) => {
        if (options[0].startsWith("$")) return;
        if (options[1].disabled) return;
        this.verbose.info(`Loading ${key}-${options[0]}`);
        // add to quick, if quick
        if (options[1].quick) this.__add_quick_elm(key, options[0]);
        // set the data of the setting
        this.data[key].options[options[0]].value = this.get_setting(key, options[0]);
        this.__call_listener(key, options[0], options[1].value); // important to send out the update upon true load.
      });
    });
  }

  /**
  * Make a category for the settings
  * @param {string} category The category to make
  */
  __make_category(category) {
    // don't add a category if everything is disabled
    if (Object.entries(this.data[category].options).filter((entry) => !entry[1].disabled).length === 0) return;

    // create the category element
    const elements = document.getElementById("setting-key");
    const button = document.createElement("button");
    button.innerText = category;
    button.addEventListener('click', (_) => this.__load_ui(category));
    elements.appendChild(button);
  }

  /**
   * Load templates for the settings
   */
  async __load_templates() {
    this.verbose.log("Loading templates...");
    this.templates = {
      'main': await loader.get_contents_from_server("Scripts/Settings/templates/main.html", true, loader.RETURN_TYPE.document),
      'quick': await loader.get_contents_from_server("Scripts/Settings/templates/quick.html", true, loader.RETURN_TYPE.document)
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
    title.innerText = capitalise(setting).replace(/_/g, ' ');

    /** @type {HTMLElement} */
    let description = node.querySelector('[tag="description"]');
    description.innerText = details.description;

    /** @type {HTMLInputElement} */
    // process setting the default value of the input based off data provided
    let input = node.querySelector('[tag="input"]');
    let inputParent = node.querySelector('[tag="input-parent"]');
    input.value = details.value;

    // depending on the type, some differences are in order.
    switch (details.type) {
      case 'number':
        input.type = 'number';
        inputParent.classList.add('field', 'border', 'fill')
        input.min = details.range?.lower;
        input.max = details.range?.upper;
        input.value = details.value;
        break;
      case 'bool':
        input.type = 'checkbox';
        inputParent.classList.add('checkbox', 'extra');
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
          let quick = document.getElementById('Settings').querySelector(`[tag="${category}-${setting}"]`);
          if (quick) {
            quick.querySelector('input').checked = value;
          }
          break;
        case 'number':
          value = Math.min(Math.max(input.value, details.range?.lower), details.range?.upper);
          input.value = value;
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
          // annoying checkboxs...
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
    // Early return if the required does not exist.
    if (required == undefined) return null;

    // loop through all the requires to check everything is right
    this.verbose.log(`Checking required for: `, `${category}-${setting}`);
    let allowed = Object.entries(required).every(([key, value]) => {
      // get the details
      let details = key.split("-");
      this.verbose.log(`(Sub) check required for: `, key);
      // check the parent for requirements
      let parent_success = this.__required(details[0], details[1]);
      this.verbose.log(`(Sub) parent success: `, parent_success);

      // Parent can only successded if the parent value is what we except.
      let parent = this.get_setting(details[0], details[1]);
      let parent_value = parent == value;
      return parent_value && (parent_success == null || parent_success);
    });
    this.verbose.log(`Allowed: `, allowed);

    let node = this.cache.get(`${category}-${setting}`);
    if (node == undefined) return allowed;

    // hide or show the node based on the parent's enabled state
    node.hidden = !allowed;
    return allowed;
  }

  /**
  * Go through all the settings in a particular category.
  */
  __update_required(category) {
    // still have to check all of the category though.
    Object.keys(this.data[category].options).forEach((setting) => {
      if (setting.startsWith("$")) return;
      // only if requires
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
      if (this.data[category].options[option].disabled) return;
      this.__create_ui_value(category, option);
      this.__required(category, option);
    });
  }

  /**
  * Create a quick setting so the whole ui doesn't need to be opened
  * @param {string} category Category of setting
  * @param {string} setting Setting name itself
  */
  __add_quick_elm(category, setting) {
    this.verbose.log(`Adding quick element: ${category}-${setting}`);

    /** @type {HTMLElement} */
    let quick = this.templates.quick.cloneNode(true).getElementsByTagName('label').item(0);
    quick.setAttribute('tag', `${category}-${setting}`);
    let input = quick.querySelector('input');
    // button
    input.addEventListener('click', () => {
      this.set_setting(category, setting, input.checked);
      let cache = this.cache.get(`${category}-${setting}`);
      if (cache) {
        cache.querySelector('input').checked = input.checked;
      }
    });
    input.checked = this.get_setting(category, setting);

    // icon
    let icon = quick.querySelectorAll("i").item(1);
    this.verbose.log(`Adding icon class:`, ...this.data[category].options[setting].icon?.split(" "));
    icon.classList.add(...this.data[category].options[setting].icon?.split(" "));

    // insert
    let settings = document.getElementById('Settings');
    let more = settings.getElementsByTagName('button').item(0);
    settings.insertBefore(quick, more);
  }

  /**
  * Add a listener to wait for a setting to be changed before updating stuff
  * @param {string} category The setting category
  * @param {string} setting The setting name
  * @param {Function} callback The function to call upon the setting being changed
  */
  add_listener(category, setting, callback) {
    this.verbose.info(`Adding listener: ${category}-${setting}`);
    this.listeners.set(`${category}-${setting}`, callback);
  }

  /**
  * Remove a listener
  * @param {string} category The setting category
  * @param {string} setting The setting name
  */
  remove_listener(category, setting) {
    this.listeners.delete(`${category}-${setting}`);
  }


  /**
  * Call a listener
  * @param {string} category The setting category
  * @param {string} setting The setting name
  * @param {SettingType} value The value to send to the callback function
  */
  __call_listener(category, setting, value) {
    // `?` is very useful here...
    this.listeners.get(`${category}-${setting}`)?.(value);
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
    this.__call_listener(category, setting, value);
    this.__update_required(category, setting);
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
      // ability to flip the state if not defined
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
