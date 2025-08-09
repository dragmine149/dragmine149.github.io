import { Verbose } from "../Scripts/verbose.mjs";
import { Markdown } from "../Modules/markdown";
import { loader, RETURN_TYPE } from "../Scripts/loader/loader";
import { customHistory } from "../Scripts/loader/customHistory";
import { VIEWING_STATE } from "../Modules/template";
import { page } from "../Scripts/loader/page";
import * as url_functions from "../Scripts/loader/url_functions";

type ProjectInformation = {
  $schema: "schema.json" | "../schema.json",
  description: string,
  projects?: string,
  categories?: {
    [key: string]: string,
  }
}

type LevelInfo = {
  [key: string]: ProjectInformation | string;
}

class ProjectLoader {
  levels: LevelInfo = {};
  path: string[] = [];
  verbose: Verbose;
  markdown: Markdown;
  initial_load = false;

  constructor() {
    this.verbose = new Verbose("Projects", "#f1a942");

    (async () => {
      let root = await loader.get_contents_from_server(`Projects/Projects/metadata.json`, RETURN_TYPE.json) as ProjectInformation;
      this.path = [""];
      this.levels[this.path.toString()] = root;
    })();

    customHistory.add_listener("Projects", (_) => this.load_from_url());

    page.addFinishListener("Projects", async () => {
      if (!this.initial_load) {
        this.#set_elements();
        for (let i = 0; i < 8; i++) {
          let node = this.get_node_index(i);
          node.addEventListener('click', () => {
            // Nodes visible will also have the 'real' attribute.
            this.load_next(node.getAttribute("real") as string);
          })
        }
        this.get_node_index(8).addEventListener('click', () => { this.load_previous(); });
        this.get_node_index(9).addEventListener('click', () => { this.load_previous(); });
        this.initial_load = true;
      }

      await this.load_ui();
      await this.load_from_url();
    })
  }

  elements: HTMLButtonElement[] = [];
  #set_elements() {
    for (let i = 1; i <= 8; i++) {
      this.elements.push(document.getElementById(`pro-${i}`) as HTMLButtonElement);
    }
    this.elements.push(document.getElementById("pro-title") as HTMLButtonElement);
    this.elements.push(document.getElementById("pro-back") as HTMLButtonElement);
  }

  get_node_index(index: number) {
    return this.elements[index];
  }

  #load_markdown() {
    if (this.markdown) return;
    this.markdown = new Markdown({
      markedLocalTime: false,
      markedFootnote: false,
      markedImprovedImage: true,
      markedCustomHeadingId: false,
      markedHighlight: true,
      markedCenterText: true,
      markedLocalLink: (url) => {
        page.load_page_from_url(url);
        return true;
      }
    }, document.getElementById("project-description-content") as HTMLElement);
  }

  #set_state(state: VIEWING_STATE) {
    const list = document.getElementById("projects") as HTMLElement | null;
    const viewer = document.getElementById("project-descriptions") as HTMLElement | null;

    if (list) list.hidden = state !== VIEWING_STATE.List;
    if (viewer) viewer.hidden = state !== VIEWING_STATE.Viewer;
  }

  layouts = [
    0b1111_1111,  // [0, 1, 2, 3, 4, 5, 6, 7],
    0b0000_0010,  // [1],
    0b0100_0010,  // [1, 6],
    0b0001_1010,  // [1, 3, 4],
    0b0101_1010,  // [1, 3, 4, 6],
    0b1110_0101,  // [0, 2, 5, 6, 7],
    0b1110_0111,  // [0, 1, 2, 5, 6, 7],
    0b1110_1111,  // [0, 1, 2, 3, 5, 6, 7],
    0b1111_1111,  // [0, 1, 2, 3, 4, 5, 6, 7],
  ];

  /**
   * Credit: code written by T3 Chat (GPT-5 mini)
   *
   * Return the position (0-based, LSB = 0) of the i-th set bit in `num`.
   * If the i-th set bit does not exist, returns 0.
   */
  ithSetBitPosition(num: number, i: number) {
    num = num >>> 0; // ensure unsigned 32-bit
    i = Math.max(0, i | 0);

    let count = 0;
    for (let pos = 0; pos < 32; pos++) {
      if ((num & (1 << pos)) !== 0) {
        if (count === i) return pos;
        count++;
      }
    }
    return 0;
  }


  /**
  * Makes all other elements that are not in the layout invisible so they don't cause weird issues in ui.
  * @param layout The layout of numbers that has been loaded
  */
  #clear_rest(layout: number) {
    for (let i = 0; i < 8; i++) {
      if (!(layout >> i & 1)) {
        const node = this.get_node_index(i);
        node.disabled = true;
        node.classList.add("hidden");
        node.removeAttribute("real");

        node.getElementsByClassName("title")[0].textContent = "";
        node.getElementsByClassName("description")[0].textContent = "";
      }
    }
  }

  #set_node_details(node_index: number, title: string, description: string | null, real: string) {
    this.verbose.debug({ node_index, title, description, real });
    const node = this.get_node_index(node_index);
    node.getElementsByClassName("title")[0].textContent = title;
    node.getElementsByClassName("description")[0].textContent = description;
    node.disabled = false;
    node.classList.remove("hidden");
    node.setAttribute("real", real);
  }

  async #process_element(entry: [string, string], index: number, metadata = false) {
    const path = this.path.join("/").concat("/" + entry[1]);
    const data = await loader.get_contents_from_server(`Projects/Projects/${path}${metadata ? '/metadata.json' : '.md'}`, metadata ? RETURN_TYPE.json : RETURN_TYPE.text) as string | ProjectInformation;
    this.verbose.log(`Processing element '${entry[1]}' at '${this.path.toString()}'`);
    this.levels[this.path.concat(entry[1]).toString()] = data;
    this.#set_node_details(index, entry[0], typeof data === "string" ? null : data.description, entry[1]);
  }

  /**
  * Load the ui
  */
  async load_ui() {
    this.verbose.log(`Loading list of path: ${this.path.toString()}`);
    this.#set_state(VIEWING_STATE.List);
    let project_list = this.levels[this.path.toString()];
    if (project_list == undefined) {
      return this.verbose.log(`Failed to load path as not in cache`);
    }

    if (typeof project_list == "string") {
      return this.load_page();
    }

    const categories = project_list.categories ? Object.entries(project_list.categories) : [];
    const projects = project_list.projects ? Object.entries(project_list.projects) : [];
    const total = categories.length + projects.length;

    for (let i = 0; i < total; i++) {
      let entry = i < categories.length ? categories[i] : projects[i - categories.length];
      await this.#process_element(entry, this.ithSetBitPosition(this.layouts[total], i), i < categories.length);
    }

    this.#clear_rest(this.layouts[total]);
  }

  load_page() {
    this.#load_markdown();
    this.#set_state(VIEWING_STATE.Viewer);
    // this.verbose.log(this.path);
    // this.verbose.log(this.levels[this.path.toString()]);
    // This function should only be called when we have data, so this is fine.
    this.markdown.parse(this.levels[this.path.toString()] as string);
  }

  async load_next(text?: string) {
    if (text === undefined || text === null || text === "") {
      this.verbose.warn("Invalid text provided");
      return;
    }

    this.verbose.log(`Current path: ${this.path}, adding: ${text}`);
    this.path.push(text);
    this.verbose.log(`Aiming for ${this.path}`);
    customHistory.store_page(new URL(`${url_functions.get_current_root_subpage()}?project=${this.path.join('/')}`));

    if (typeof this.levels[this.path.toString()] === 'string') {
      // this means it's a project.
      this.verbose.log("Project found!");
      this.load_page();
      // this.verbose.warn("Early break for now. TODO: implement");
      return;
    }

    await this.load_ui();
    this.verbose.log(`Finishished loading: ${text} (${this.path.join('/')}`);
  }

  load_previous() {
    if (this.path.length > 1) {
      this.path.pop();
    }

    customHistory.store_page(new URL(`${url_functions.get_current_root_subpage()}?project=${this.path.join('/')}`));
    this.load_ui();
  }

  async load_from_url() {
    const url = url_functions.get_url();
    this.verbose.log(`Attempting to load project page from url: ${location}`);
    const project = url.searchParams.get("project");
    if (!project) {
      this.path = [""];
      await this.load_ui();
      return;
    }

    // load the category from the url (converts back into normal form).
    let new_path = project.split('/');
    this.verbose.log(`Loading category: '${new_path.join('/')}'`);
    // for each depth
    for (let level = new_path.length; level >= 0; level--) {
      this.verbose.log(`Checking data at '${new_path.slice(0, level).join('/')}'`);
      // find the depth where we have data for
      if (this.levels[new_path.slice(0, level).toString()]) {
        this.verbose.log(`Found data at '${new_path.slice(0, level).join('/')}', reversing`);
        // then reverse the depth to include the rest of the elements
        this.path = new_path.slice(0, level - 1);
        for (let depth = level - 1; depth < new_path.length; depth++) {
          this.verbose.log(`Current path: '${this.path}'. Heading towards: ${new_path[depth]}`);
          // probably could do this without updating the UI all the time, but for now oh well.
          await this.load_next(new_path[depth]);
        }
        return;
      }
    }
  }
}

const projects = new ProjectLoader();

function initialise(): boolean { return true };

export { projects, initialise }
