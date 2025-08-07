import { DragStorage } from "../storage.ts";
import { Verbose } from "../verbose.mjs";
import { loader, RETURN_TYPE } from "../loader/loader.ts";

type SettingType = (boolean | number | string);

type SettingTypeString = ("bool" | "number" | "string");

interface SettingRangeObject {
  lower: number;
  upper: number;
}

type SettingRequiresObject = {
  [key: string]: boolean | number
};
/**
* @description An object where keys are setting identifiers and values are required states (boolean or number)
*/
interface SettingOptionObject {
  description: string;
  type: (SettingTypeString);
  default: (SettingType);
  quick: boolean;
  value: (SettingType);
  range?: SettingRangeObject;
  requires?: SettingRequiresObject;
  disabled?: string;
  icon?: string;
}

interface SettingCategoryObject {
  description: string;
  options: {
    [key: string]: SettingOptionObject
  };
}

class DragSettings {
  cache: Map<string, HTMLElement>;

  /**
  * The page currently visible
  */
  currently_viewing: string;

  /**
  * Default templates to avoid having to use code everywhere to make a complex one.
  */
  templates: {
    'main': Document;
    'quick': Document;
  };


  /**
   * Settings data structure
   */
  data: { [s: string]: SettingCategoryObject; };

  /** Functions to call upon settings being changed */
  listeners: Map<string, Function>;
  verbose: Verbose;
  settings: DragStorage;

  constructor() {
    this.verbose = new Verbose('Settings', '#f5a97e');
    this.settings = new DragStorage("setting");
    this.cache = new Map();
    this.listeners = new Map();

    // load the settings from local storage as much as we can.
    // this allows the website to load to a semi user set up state without having all the data yet.
    this.data = {};
    this.settings.listStorage().forEach((item) => {
      let [category, key] = item.split("-");

      this.data[category] = { description: 'e', options: { [key]: { value: 0, quick: false, description: '', type: "number", default: 0 } } };
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
    this.data = await loader.get_contents_from_server("Scripts/Settings/settings.json", RETURN_TYPE.json);

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
  * @param category The category to make
  */
  __make_category(category: string) {
    // don't add a category if everything is disabled
    if (Object.entries(this.data[category].options).filter((entry) => !entry[1].disabled).length === 0) return;

    // create the category element
    const elements = document.getElementById("setting-key");
    const button = document.createElement("button");
    button.innerText = category;
    button.addEventListener('click', (_) => this.__load_ui(category));
    elements?.appendChild(button);
  }

  /**
   * Load templates for the settings
   */
  async __load_templates() {
    this.verbose.log("Loading templates...");
    this.templates = {
      'main': await loader.get_contents_from_server("Scripts/Settings/templates/main.html", RETURN_TYPE.document),
      'quick': await loader.get_contents_from_server("Scripts/Settings/templates/quick.html", RETURN_TYPE.document)
    };
  }

  /**
   * Create a ui element for a setting.
   * @param category The category of the setting.
   * @param setting The key of the setting.
   */
  __create_ui_value(category: string, setting: string) {
    let value = document.getElementById("setting-value")?.getElementsByClassName('values')?.item(0) as HTMLElement;
    if (value == undefined) {
      this.verbose.error("Failed to find setting-value element");
      return;
    }

    // check to see if in cache, if so add and ignore the rest.
    let cached = this.cache.get(`${category}-${setting}`) as HTMLElement;
    if (cached) {
      value.appendChild(cached);
      return;
    }

    let details: SettingOptionObject = this.data[category].options[setting];

    let node = this.templates.main.querySelector('[tag="main"]')?.cloneNode(true) as HTMLElement;

    let title = node.querySelector('[tag="title"]') as HTMLElement;
    title.innerText = capitalise(setting).replace(/_/g, ' ');

    let description = node.querySelector('[tag="description"]') as HTMLElement;
    description.innerText = details.description;

    // process setting the default value of the input based off data provided
    let input = node.querySelector('[tag="input"]') as HTMLInputElement;
    let inputParent = node.querySelector('[tag="input-parent"]');
    input.value = details.value.toString();

    // depending on the type, some differences are in order.
    switch (details.type) {
      case 'number':
        input.type = 'number';
        inputParent?.classList.add('field', 'border', 'fill');
        if (input.min) input.min = details.range?.lower.toString() || "0";
        if (input.max) input.max = details.range?.upper.toString() || "0";
        input.value = (details.value as number).toString();
        break;
      case 'bool':
        input.type = 'checkbox';
        inputParent?.classList.add('checkbox', 'extra');
        if (input.checked) input.checked = details.value as boolean;
        break;
      case 'string':
      default:
        input.type = 'text';
        input.value = details.value as string;
    }

    // listen and wait for a change
    input.addEventListener('change', (_) => {
      let value: SettingType;
      switch (details.type) {
        case 'bool':
          value = input.checked;
          let quick = document.getElementById('Settings')?.querySelector(`[tag="${category}-${setting}"]`)?.querySelector("input");
          if (quick) quick.checked = value;
          break;
        case 'number':
          value = Math.min(Math.max(Number.parseInt(input.value), details.range?.lower || 0), details.range?.upper || 0);
          input.value = (value as number).toString();
          break;
        default:
          value = input.value;
      }
      this.set_setting(category, setting, value);
    });

    // listen and wait for default reset
    let default_node = node.querySelector('[tag="default"]');
    default_node?.addEventListener('click', (_) => {
      switch (details.type) {
        case 'bool':
          // annoying checkboxs...
          input.checked = details.default as boolean;
          break;
        default:
          input.value = details.default as string;
      }
    });

    // add to cache and to ui.
    this.cache.set(`${category}-${setting}`, node);
    value.appendChild(node);
  }

  /**
  * Hides or shows an object based on if the required object is enabled or not
  * @param category The category of the setting
  * @param setting The setting in the category
  */
  __required(category: string, setting: string) {
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
  __update_required(category: string) {
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
  * @param category The category of the setting to load.
  */
  __load_ui(category: string) {
    // check to see if exists, which would be a very big issue if it didn't...
    let value = document.getElementById("setting-value") as HTMLElement;
    if (value == undefined) {
      this.verbose.error(`Element with id "setting-value" not found.`);
      return;
    }

    // set title, description, options, all that stuff
    let title = value.getElementsByClassName('title').item(0);
    if (title) title.innerHTML = capitalise(category);

    let description = value.getElementsByClassName('description').item(0);
    if (description) description.innerHTML = this.data[category].description;

    // clearing the innerhtml to quickly clean out the old stuff.
    // probably a nicer alternative, but whatever.
    let input_value = value.getElementsByClassName('values').item(0);
    if (input_value) input_value.innerHTML = '';

    Object.keys(this.data[category].options).forEach((option) => {
      if (this.data[category].options[option].disabled) return;
      this.__create_ui_value(category, option);
      this.__required(category, option);
    });
  }

  /**
  * Create a quick setting so the whole ui doesn't need to be opened
  * @param category Category of setting
  * @param setting Setting name itself
  */
  __add_quick_elm(category: string, setting: string) {
    this.verbose.log(`Adding quick element: ${category}-${setting}`);

    let quick = (this.templates.quick.cloneNode(true) as HTMLElement).getElementsByTagName('label').item(0) as HTMLElement;
    quick.setAttribute('tag', `${category}-${setting}`);
    let input = quick.querySelector('input');
    if (input == null) {
      this.verbose.warn("Failed to add quick element: ${category}-${setting}");
      return;
    }

    // button
    input.addEventListener('click', () => {
      this.set_setting(category, setting, input.checked);
      let cache = this.cache.get(`${category}-${setting}`)?.querySelector("input");
      if (cache) cache.checked = input.checked;
    });
    input.checked = this.get_setting(category, setting) as boolean;

    // icon
    let icon = quick.querySelectorAll("i").item(1);
    this.verbose.log(`Adding icon class:`, ...this.data[category].options[setting].icon?.split(" ") || []);
    icon.classList.add(...this.data[category].options[setting].icon?.split(" ") || []);

    // insert
    let settings = document.getElementById('Settings');
    if (settings) {
      let more = settings.getElementsByTagName('button').item(0);
      settings.insertBefore(quick, more);
    }
  }

  /**
  * Add a listener to wait for a setting to be changed before updating stuff
  * @param category The setting category
  * @param setting The setting name
  * @param callback The function to call upon the setting being changed
  */
  add_listener(category: string, setting: string, callback: (value: SettingType) => void) {
    this.verbose.info(`Adding listener: ${category}-${setting}`);
    this.listeners.set(`${category}-${setting}`, callback);
  }

  /**
  * Remove a listener
  * @param category The setting category
  * @param setting The setting name
  */
  remove_listener(category: string, setting: string) {
    this.listeners.delete(`${category}-${setting}`);
  }


  /**
  * Call a listener
  * @param category The setting category
  * @param setting The setting name
  * @param value The value to send to the callback function
  */
  __call_listener(category: string, setting: string, value: SettingType) {
    // `?` is very useful here...
    this.listeners.get(`${category}-${setting}`)?.(value);
  }

  /**
  * Sets any setting to the provided value
  * @param category The setting category
  * @param setting The name of the setting
  * @param value The value to store. (will be saved as string due to localstorage)
  */
  set_setting(category: string, setting: string, value: SettingType) {
    this.verbose.log(`Saving setting: ${category}-${setting} (setting to ${value})`);
    this.settings.setStorage(`${category}-${setting}`, value.toString());
    this.__call_listener(category, setting, value);
    this.__update_required(category);
  }

  /**
  * Get any setting and returns it as the proper format.
  * @param category The setting category
  * @param setting The name of the setting
  * @returns The result of the setting, in a format befiting of the setting where possible.
  */
  get_setting(category: string, setting: string): SettingType {
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
        default:
          return '';
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
  * @param state The state of which to put the settings menu into
  */
  visible(state: boolean | undefined = undefined) {
    let big_settings = document.getElementById("big-settings");
    if (big_settings == null) return;
    if (state === undefined || state === null) {
      // ability to flip the state if not defined
      state = big_settings.hidden;
    }
    if (typeof state !== 'boolean') {
      this.verbose.warn('Settings visibility value must be boolean');
      return;
    }

    // flip state here otherwise it's going to be conufsing in the actual code.
    big_settings.hidden = !state;
  }
}

/**
* Capitalise a string.... Why does JS not have this already?
* @param {string} str The string to capitalise
* @returns The same string, but with a capital start
*/
function capitalise(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


const settings = new DragSettings();

export { settings, capitalise }
