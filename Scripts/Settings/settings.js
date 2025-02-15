class DragSettings {
  /** @type {HTMLButtonElement[]} */
  options;

  /** @type {Map<string, HTMLElement>} */
  cache;

  /** @type {string} */
  currently_viewing;

  constructor() {
    this.settings = new DragStorage("setting");
    // this.data = fetch("Scripts/Settings/Settings.json").then((response) => response.json().then((r) => r));
    // this.data = fetch("Scripts/Settings/Settings.json").then((r) => console.log(r));
    this.options = [];
    this.cache = new Map();

    /** @type {object} */
    this.data = loader.get_contents_from_server("Scripts/Settings/settings.json", true, loader.RETURN_TYPE.json);
    (async () => {
      this.data = await this.data;

      Object.entries(this.data).forEach((entry) => {
        if (entry[0].startsWith("$")) {
          // ignore stuff starting with "$" as it's just more dev related.
          return;
        }

        console.log(entry);

        Object.entries(entry[1].options).forEach((entry2) => {
          console.log(`Attempting to load: ${entry[0]}-${entry2[0]}`);
          this.data[entry[0]].options[entry2[0]].state = this.get_setting(entry[0], entry2[0]);

          if (this.data[entry[0]].options[entry2[0]].quick) {
            console.log(`Found quick elm: ${this.data[entry[0]].options[entry2[0]]}`);
          }
        })
      })

      const elements = document.getElementById("setting-key");
      Object.keys(this.data).forEach((key) => {
        const button = document.createElement("button");
        button.innerText = key;
        button.addEventListener('click', (_) => this.load_ui(key));
        elements.appendChild(button);
        this.options.push(button);
      })
    })();
  }

  /**
  * Load the settings ui
  * @param {string} setting The key of the setting to load.
  */
  load_ui(setting) {
    if (this.currently_viewing == setting) {
      // avoid reloading this page.
      return;
    }
    this.currently_viewing = setting;

    this.options.forEach((btn) => {
      btn.classList.remove('active')
      if (btn.innerText == setting) {
        btn.classList.add('active');
      }
    });

    console.log(`Loading setting: ${setting}`);
    const value = document.getElementById("setting-value");

    const title = value.getElementsByClassName("title").item(0);
    title.innerText = setting;

    const description = value.getElementsByClassName("description").item(0);
    description.innerText = this.data[setting].description;

    const options = value.getElementsByClassName("values").item(0);
    while (options.firstChild) {
      options.removeChild(options.firstChild);
    }

    Object.entries(this.data[setting].options).forEach((entry) => {
      const setting_name = `${setting}-${entry[0]}`;
      if (this.cache.has(setting_name)) {
        options.appendChild(this.cache.get(setting_name));
        return;
      }

      const elm = document.createElement("div");
      const title = document.createElement("span");
      title.innerText = entry[0];

      const desc = document.createElement("span");
      desc.innerText = entry[1].description;

      var option;
      switch (entry[1].type) {
        case "bool":
          option = document.createElement("input");
          option.type = "checkbox";
          option.checked = entry[1].state;
          option.addEventListener('click', (_) => this.set_setting(setting_name, option.checked));
          break;

        case "number":
          option = document.createElement("span");
          option.innerText = "WIP";

        default:
          break;
      }

      const setDefault = document.createElement("button");
      setDefault.innerText = "Set to default";
      setDefault.addEventListener('click', (_) => this.set_setting(setting_name, entry[1].default, (v) => {
        option.checked = v;
      }));

      const setRecomened = document.createElement("button");
      setRecomened.innerText = `Set to recomened (${entry[1].recomened})`;
      setRecomened.addEventListener('click', (_) => this.set_setting(setting_name, entry[1].recomened, (v) => {
        option.checked = v;
      }));

      elm.appendChild(title);
      elm.appendChild(option);
      elm.appendChild(document.createElement("span"));
      elm.appendChild(desc);
      elm.appendChild(setDefault);
      elm.appendChild(setRecomened);

      this.cache.set(setting_name, elm);
      options.appendChild(elm);
    });
  }

  set_setting(setting, value, callback) {
    console.log(`Saving setting: ${setting} (setting to ${value})`);
    this.settings.setStorage(setting, value);
    if (callback !== undefined) {
      callback(value);
    }
  }

  get_setting(category, setting) {
    // return this.settings.getStorage(`${category}-${setting}`);
    const value = this.settings.getStorage(`${category}-${setting}`);

    if (value === null || value === undefined) {
      return null;
    }

    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    if (!isNaN(value)) {
      return Number(value);
    }
  }

  /**
  * To show or to hide the settings
  * @param {boolean} state The state of which to put the settings menu into
  */
  visible(state) {
    if (typeof state !== 'boolean') {
      console.warn('Settings visibility value must be boolean');
      return;
    }

    // flip state here otherwise it's going to be conufsing in the actual code.
    document.getElementById("big-settings").hidden = !state;
  }
}

const settings = new DragSettings();
