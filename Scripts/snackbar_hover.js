class SnackBar {
  AREA = {
    Top_Left: 0,
    Top_Middle: 1,
    Top_Right: 2,
    Middle_Left: 3,
    Middle_Right: 4,
    Bottom_Left: 5,
    Bottom_Middle: 6,
    Bottom_Right: 7,
    None: 8
  }

  /**
  * @param {SnackBar.AREA} area
  * @returns {String}
  */
  get_area_code(area) {
    switch (area) {
      case this.AREA.Top_Left:
        return "tl";
      case this.AREA.Top_Middle:
        return "tm";
      case this.AREA.Top_Right:
        return "tr";
      case this.AREA.Middle_Left:
        return "ml";
      case this.AREA.Middle_Right:
        return "mr";
      case this.AREA.Bottom_Left:
        return "bl";
      case this.AREA.Bottom_Middle:
        return "bm";
      case this.AREA.Bottom_Right:
        return "br";
      case this.AREA.None:
        return "no";
      default:
        console.log("ERROR: Invalid area");
        return "";
    }
  }

  constructor() {
    Object.freeze(this.AREA);
  }

  /**
  * Gets the corner of the screen the mouse is in, if any.
  * @param {number} mouseX
  * @param {number} mouseY
  * @returns {bool}
  */
  get_mouse_corner(mouseX, mouseY) {
    const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    const is_on_left = mouseX <= width * 0.025;
    const is_in_xiddle = mouseX >= width * 0.35 && mouseX <= width * 0.65;
    const is_on_right = mouseX >= width * 0.975;
    const is_on_top = mouseY <= height * 0.15;
    const is_in_yiddle = mouseY >= height * 0.35 && mouseY <= height * 0.65;
    const is_on_bottom = mouseY >= height * 0.85;

    if (is_on_left && is_on_top) {
      return this.AREA.Top_Left;
    }
    if (is_in_xiddle && is_on_top) {
      return this.AREA.Top_Middle;
    }
    if (is_on_right && is_on_top) {
      return this.AREA.Top_Right;
    }
    if (is_on_left && is_in_yiddle) {
      return this.AREA.Middle_Left;
    }
    if (is_on_right && is_in_yiddle) {
      return this.AREA.Middle_Right;
    }
    if (is_on_left && is_on_bottom) {
      return this.AREA.Bottom_Left;
    }
    if (is_in_xiddle && is_on_bottom) {
      return this.AREA.Bottom_Middle;
    }
    if (is_on_right && is_on_bottom) {
      return this.AREA.Bottom_Right;
    }
    return this.AREA.None;
  }

  /**
  * Returns the element from the id
  * @param {String} elm_id
  */
  get_elm_from_id(elm_id) {
    return document.getElementById(elm_id);
  }

  /** @param {SnackBar.AREA} area */
  show_elements(area) {
    /** @type {HTMLElement[]} */
    const sub_area = this.elements[area];
    sub_area.forEach((elm) => {
      this.get_elm_from_id(elm).classList.add("active");
    })
  }

  remove_elements(area) {
    if (area == this.AREA.None) {
      return;
    }

    /** @type {HTMLElement[]} */
    const sub_area = this.elements[area];
    sub_area.forEach((elm) => {
      elm = this.get_elm_from_id(elm);
      // makes sure we don't just disapear when we are still using it.
      if (elm.matches(':hover')) {
        return;
      }

      elm.classList.remove("active");
    })
  }

  /** @param {SnackBar.AREA} area */
  toggle_area(area) {
    if (this.last_area == area) {
      this.remove_elements(area);
      this.last_area = this.AREA.None;
      return
    }

    this.remove_elements(this.last_area);
    this.show_elements(area);
    this.last_area = area;
  }

  /** @type {String[][]} */
  elements = [
    [], [], [], [], [], [], [], []
  ]
  /** @type {SnackBar.AREA} */
  last_area = this.AREA.None;
  /**
  * Adds an area to trigger on hover in that area.
  * @param {String} element
  * @param {SnackBar.AREA} area
  */
  set_area(element, area) {
    /** @type {String[]} */
    const sub_area = this.elements[area];
    sub_area.push(element);

    document.getElementById(`snackbar-${this.get_area_code(area)}`).classList.add("active");
  }
}

let snackbar = new SnackBar();

window.addEventListener('mousemove', (event) => {
  const area = snackbar.get_mouse_corner(event.clientX, event.clientY);
  if (area != snackbar.last_area && snackbar.last_area != snackbar.AREA.None) {
    snackbar.remove_elements(snackbar.last_area);
  }

  if (area == snackbar.AREA.None) {
    return;
  }

  snackbar.show_elements(area);
  snackbar.last_area = area;
})
