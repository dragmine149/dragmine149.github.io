class ProjectLoader {
  projects = new Map();

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
  async fetch_data(project) {
    const page_location = page.get_current_page() + `Projects/Projects/${project}/metadata.json`;
    let metadata = await page.__get_content(page_location);
    this.projects.set(project, JSON.parse(metadata));
  }

  async check_and_fetch() {
    if (this.list == undefined) {
      this.fetch_projects();
    }
    return this.list;
  }

  async view_projects() {
    await this.fetch_projects();
    Object.keys(this.list).forEach((key, index) => {
      let node = this.get_node(this.elements[index]);
      node.getElementsByClassName("title")[0].textContent = key;
    });

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

    switch (Object.keys(this.list).length) {
      case 1:
        project_node.insertBefore(this.get_node_index(1), this.get_node_index(0));
        for (let i = 1; i < 8; i++) {
          this.get_node_index(i).classList.add("hidden");
        }
        break;
      case 2:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(0));
        project_node.insertBefore(this.get_node_index(1), this.get_node_index(6));
        for (let i = 2; i < 8; i++) {
          this.get_node_index(i).classList.add("hidden");
        }
        break;
      case 3:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(0));
        project_node.insertBefore(this.get_node_index(6), this.get_node_index(1));
        project_node.insertBefore(this.get_node_index(8), this.get_node_index(2));
        for (let i = 3; i < 8; i++) {
          this.get_node_index(i).classList.add("hidden");
        }
        break;
      case 4:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(0));
        project_node.insertBefore(this.get_node_index(6), this.get_node_index(1));
        project_node.insertBefore(this.get_node_index(8), this.get_node_index(2));
        project_node.insertBefore(this.get_node_index(5), this.get_node_index(3));
        for (let i = 4; i < 8; i++) {
          this.get_node_index(i).classList.add("hidden");
        }
        break;
      case 5:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(1));
        project_node.insertBefore(this.get_node_index(6), this.get_node_index(2));
        project_node.insertBefore(this.get_node_index(8), this.get_node_index(2));
        project_node.insertBefore(this.get_node_index(5), this.get_node_index(2));
        for (let i = 5; i < 8; i++) {
          this.get_node_index(i).classList.add("hidden");
        }
        break;
      case 6:
        project_node.insertBefore(this.get_node_index(7), this.get_node_index(3));
        project_node.insertBefore(this.get_node_index(8), this.get_node_index(3));
        project_node.insertBefore(this.get_node_index(6), this.get_node_index(3));
        for (let i = 6; i < 8; i++) {
          this.get_node_index(i).classList.add("hidden");
        }
        break;
      case 7:
        this.get_node_index(7).classList.add("hidden");
      case 8:
        this.get_node_index(8).classList.add("hidden");
      default: break;
    }

    Object.values(this.list).forEach(async (value, index) => {
      await this.fetch_data(value);
      let node = this.get_node(this.elements[index]);
      node.children[1].textContent = this.projects.get(value).description;
    });
  }
}

let projects = new ProjectLoader();

function projects_loader() {
  projects.view_projects();
}
