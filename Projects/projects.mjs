import { Verbose } from "../Scripts/verbose.mjs";
import { Markdown } from "../Modules/markdown.mjs";
import { loader, customHistory, page } from "../dist/Scripts/new_loader.js";

class ProjectLoader {
  __levels = {};
  __path = [];

  constructor() {
    this.verbose = new Verbose("Projects", "#f1a942");

    (async () => {
      this.__levels[""] = await loader.get_contents_from_server(`Projects/Projects/metadata.json`, true, loader.RETURN_TYPE.json);
      this.__path = [""];
      await this.load_ui();
      await this.load_from_url();
    })();

    customHistory.add_listener("Projects", (_) => this.load_from_url());
  }

  elements = ["pro-1", "pro-2", "pro-3", "pro-4", "pro-5", "pro-6", "pro-7", "pro-8", "pro-title"];
  get_node_index(index) {
    return document.getElementById(this.elements[index]);
  }

  __load_markdown() {
    if (this.markdown) return;
    if (Markdown) {
      this.markdown = new Markdown({
        markedLocalTime: false,
        markedFootnote: false,
        markedImprovedImage: true,
        markedCustomHeadingId: false,
        markedHighlight: true,
        markedCenterText: true
      }, document.getElementById("project-description-content"));
    }
  }

  __state = {
    list: 0, viewer: 1
  }

  __set_state(state) {
    const list = document.getElementById("projects");
    const viewer = document.getElementById("project-descriptions");

    list.hidden = true;
    viewer.hidden = true;
    switch (state) {
      case this.__state.viewer:
        viewer.hidden = false;
        return;

      default:
      case this.__state.list:
        list.hidden = false;
        return;
    }
  }

  __layouts = [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [1],
    [1, 6],
    [1, 3, 4],
    [1, 3, 4, 6],
    [0, 2, 5, 6, 7],
    [0, 1, 2, 5, 6, 7],
    [0, 1, 2, 3, 5, 6, 7],
    [0, 1, 2, 3, 4, 5, 6, 7]
  ];

  /**
  * Makes all other elements that are not in the layout invisible so they don't cause weird issues in ui.
  * @param {number[]} layout The layout of numbers that has been loaded
  */
  __clear_rest(layout) {
    for (let i = 0; i < 8; i++) {
      if (layout.indexOf(i) === -1) {
        const node = this.get_node_index(i);
        node.disabled = true;
        node.classList.add("hidden");
        node.removeAttribute("real");

        node.getElementsByClassName("title")[0].textContent = "";
        node.getElementsByClassName("description")[0].textContent = "";
      }
    }
  }

  __set_node_details(node_index, title, description, real) {
    const node = this.get_node_index(node_index);
    node.getElementsByClassName("title")[0].textContent = title;
    node.getElementsByClassName("description")[0].textContent = description;
    node.disabled = false;
    node.classList.remove("hidden");
    node.setAttribute("real", real);
  }

  async __process_element(entry, index, metadata = false) {
    const path = this.__path.join("/").concat("/" + entry[1]);
    const data = await loader.get_contents_from_server(`Projects/Projects/${path}${metadata ? '/metadata.json' : '.md'}`, true, metadata ? loader.RETURN_TYPE.json : loader.RETURN_TYPE.text);
    this.verbose.log(`Processing element '${entry[1]}' at '${this.__path}'`);
    this.__levels[this.__path.concat(entry[1])] = data;
    this.__set_node_details(index, entry[0], data.description, entry[1]);
  }

  /**
  * Load the ui
  * @param {String[]} project_list
  */
  async load_ui() {
    this.verbose.log(`Loading list of path: ${this.__path}`);
    this.__set_state(this.__state.list);
    const project_list = this.__levels[this.__path];

    const categories = project_list.categories ? Object.entries(project_list.categories) : [];
    const projects = project_list.projects ? Object.entries(project_list.projects) : [];
    const total = categories.length + projects.length;

    for (let i = 0; i < total; i++) {
      if (i < categories.length) {
        await this.__process_element(categories[i], this.__layouts[total][i], true);
      } else {
        await this.__process_element(projects[i - categories.length], this.__layouts[total][i], false);
      }
    }

    this.__clear_rest(this.__layouts[total]);
  }

  load_page() {
    this.__load_markdown();
    this.__set_state(this.__state.viewer);
    this.verbose.log(this.__path);
    this.verbose.log(this.__levels[this.__path]);
    this.markdown.parse(this.__levels[this.__path]);
  }

  async load_next(text) {
    if (text === undefined || text === null || text === "") {
      this.verbose.warn("Invalid text provided");
      return;
    }

    this.verbose.log(`Current path: ${this.__path}, adding: ${text}`);
    this.__path.push(text);
    this.verbose.log(`Aiming for ${this.__path}`);
    customHistory.store_page(new URL(`${page.get_current_root_subpage()}?project=${this.__path.join('/')}`));

    if (typeof this.__levels[this.__path] === 'string') {
      // this means it's a project.
      this.verbose.log("Project found!");
      this.load_page();
      // this.verbose.warn("Early break for now. TODO: implement");
      return;
    }

    await this.load_ui();
    this.verbose.log(`Finishished loading: ${text} (${this.__path.join('/')}`);
  }

  load_previous() {
    if (this.__path.length > 1) {
      this.__path.pop();
    }

    customHistory.store_page(new URL(`${page.get_current_root_subpage()}?project=${this.__path.join('/')}`));
    this.load_ui();
  }

  async load_from_url() {
    const url = new URL(location);
    this.verbose.log(`Attempting to load project page from url: ${location}`);
    const project = url.searchParams.get("project");
    if (!project) {
      this.__path = [""];
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
      if (this.__levels[new_path.slice(0, level)]) {
        this.verbose.log(`Found data at '${new_path.slice(0, level).join('/')}', reversing`);
        // then reverse the depth to include the rest of the elements
        this.__path = new_path.slice(0, level - 1);
        for (let depth = level - 1; depth < new_path.length; depth++) {
          this.verbose.log(`Current path: '${this.__path}'. Heading towards: ${new_path[depth]}`);
          // probably could do this without updating the UI all the time, but for now oh well.
          await this.load_next(new_path[depth]);
        }
        return;
      }
    }
  }
}

const projects = new ProjectLoader();

function Projects_default_0() {
  projects.load_from_url();
}

document.getElementById("pro-1").addEventListener('click', () => projects.load_next(document.getElementById("pro-1").getAttribute("real")));
document.getElementById("pro-2").addEventListener('click', () => projects.load_next(document.getElementById("pro-2").getAttribute("real")));
document.getElementById("pro-3").addEventListener('click', () => projects.load_next(document.getElementById("pro-3").getAttribute("real")));
document.getElementById("pro-4").addEventListener('click', () => projects.load_next(document.getElementById("pro-4").getAttribute("real")));
document.getElementById("pro-5").addEventListener('click', () => projects.load_next(document.getElementById("pro-5").getAttribute("real")));
document.getElementById("pro-6").addEventListener('click', () => projects.load_next(document.getElementById("pro-6").getAttribute("real")));
document.getElementById("pro-7").addEventListener('click', () => projects.load_next(document.getElementById("pro-7").getAttribute("real")));
document.getElementById("pro-8").addEventListener('click', () => projects.load_next(document.getElementById("pro-8").getAttribute("real")));
document.getElementById("pro-back").addEventListener('click', () => projects.load_previous());
document.getElementById("pro-title").addEventListener('click', () => projects.load_previous());


export { projects }
