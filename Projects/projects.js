class ProjectLoader {
  projects = new Map();
  /** @type {String} */
  previous;
  /** @type {String} */
  category;

  constructor() {
    this.view_projects();
  }

  elements = ["pro-1", "pro-2", "pro-3", "pro-4", "pro-5", "pro-6", "pro-7", "pro-8", "pro-title"];
  get_node(elm_id) {
    return document.getElementById(elm_id);
  }
  get_node_index(index) {
    return document.getElementById(this.elements[index]);
  }

  async fetch_projects() {
    const page_location = page.get_current_page() + `Projects/Projects/metadata.json`;
    let project_list = await page.__get_content(page_location);
    this.list = JSON.parse(project_list);
  }

  /**
  * Fetches the metaadata for a project group
  * @param {String} project
  */
  async fetch_data(project, sub = false) {
    let page_location = page.get_current_page();
    if (!sub) {
      page_location += `Projects/Projects/${project}/metadata.json`;
    } else {
      page_location += `Projects/Projects/${project}.json`;
    }

    console.log(`Attempting to get data from: ${page_location}`);
    let metadata = await page.__get_content(page_location);
    this.projects.set(project, JSON.parse(metadata));
  }

  async check_and_fetch() {
    if (this.list == undefined) {
      this.fetch_projects();
    }
    return this.list;
  }

  /**
  * Load the ui
  * @param {String[]} project_list
  */
  async load_ui(project_list, sub = false) {
    const project_node = document.getElementById("projects");
    project_node.insertBefore(this.get_node_index(0), null);
    project_node.insertBefore(this.get_node_index(1), null);
    project_node.insertBefore(this.get_node_index(2), null);
    project_node.insertBefore(this.get_node_index(3), null);
    project_node.insertBefore(this.get_node_index(8), null);
    project_node.insertBefore(this.get_node_index(4), null);
    project_node.insertBefore(this.get_node_index(5), null);
    project_node.insertBefore(this.get_node_index(6), null);
    project_node.insertBefore(this.get_node_index(7), null);

    for (let i = 0; i < 8; i++) {
      const n = this.get_node_index(i);
      // project_node.insertBefore(n, null);
      n.disabled = true;
      n.classList.add("hidden");
      n.getElementsByClassName("title")[0].textContent = "";
      n.getElementsByClassName("description")[0].textContent = "";
    }

    switch (Object.keys(project_list).length) {
      case 1:
        project_node.insertBefore(this.get_node_index(1), this.get_node_index(0));
        break;
      case 2:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(0));
        project_node.insertBefore(this.get_node_index(1), this.get_node_index(6));
        break;
      case 3:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(0));
        project_node.insertBefore(this.get_node_index(6), this.get_node_index(1));
        project_node.insertBefore(this.get_node_index(8), this.get_node_index(2));
        break;
      case 4:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(0));
        project_node.insertBefore(this.get_node_index(6), this.get_node_index(1));
        project_node.insertBefore(this.get_node_index(8), this.get_node_index(2));
        project_node.insertBefore(this.get_node_index(5), this.get_node_index(3));
        break;
      case 5:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(1));
        project_node.insertBefore(this.get_node_index(6), this.get_node_index(2));
        project_node.insertBefore(this.get_node_index(8), this.get_node_index(2));
        project_node.insertBefore(this.get_node_index(5), this.get_node_index(2));
        break;
      case 6:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(3));
        project_node.insertBefore(this.get_node_index(8), this.get_node_index(3));
        project_node.insertBefore(this.get_node_index(6), this.get_node_index(3));
        break;
      default: break;
    }

    Object.entries(project_list).forEach(async (entry, index) => {
      let fetch = entry[1];
      if (sub) {
        console.log(entry[1]);
        fetch = `${this.list[this.category]}/${entry[1]}`;
      }
      await this.fetch_data(fetch, sub);

      const node = this.get_node_index(index);
      node.getElementsByClassName("title")[0].textContent = entry[0];
      node.getElementsByClassName("description")[0].textContent = this.projects.get(fetch).description;
      node.disabled = false;
      node.classList.remove("hidden");
    })
  }

  save_state(name) {
    console.log(`saving state: ${name}`);
    page.push_state_to_history(page.get_current_subpage(), {
      "project": name
    }, `?project=${name}`)
  }

  async view_projects() {
    await this.fetch_projects();
    this.load_ui(this.list);
  }

  load_sub_projects(category) {
    console.log(`Sub project clicked: ${category}`);

    if (this.list[category] != undefined) {
      const info = this.projects.get(this.list[category]).projects;
      this.previous = "";
      this.category = category;
      this.get_node_index(8).classList.add("button");
      this.load_ui(info, true);
      this.save_state(category);
      return;
    }

    page.push_state_to_history(page.get_current_subpage(), {
      "project": `${this.list[this.category]}/${this.projects.get(this.list[this.category]).projects[category]}`
    }, `?project=${this.list[this.category]}/${this.projects.get(this.list[this.category]).projects[category]}`);
    this.load_description_from_url();
  }

  load_previous() {
    document.getElementById("projects").hidden = false;
    document.getElementById("project-description").hidden = true;

    if (this.previous == "") {
      this.get_node_index(8).classList.remove("button");
      this.previous = "";
      this.category = "";
      this.load_ui(this.list);
      this.save_state("");
      return;
    }

    const info = this.projects.get(this.list[this.previous]).projects;
    const a = this.previous;
    this.previous = this.category;
    this.category = a;
    this.save_state(a);
    this.load_ui(info, true)
  }

  async load_description_from_url() {
    const url = new URL(location);
    const info = url.searchParams.get("Project");

    document.getElementById("projects").hidden = true;
    document.getElementById("project-descriptions").hidden = false;

    console.log(`Loading project info: ${info}`);

    await this.fetch_data(info, true);
    const data = this.projects.get(info);
    document.getElementById("project-title").innerText = data.name;
    document.getElementById("project-description").innerText = data.website;
    document.getElementById("project-link").innerText = `Provided link: ${data.url}`;
    document.getElementById("project-link").href = data.url;
  }
}

let projects = new ProjectLoader();

function projects_loader() {
  projects.view_projects();
}
