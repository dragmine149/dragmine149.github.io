enum SnackbarArea {
  Top_Left,
  Top_Middle,
  Top_Right,
  Middle_Left,
  Middle_Right,
  Bottom_Left,
  Bottom_Middle,
  Bottom_Right,
  None
}

class SnackBar {
  get_area_code(area: SnackbarArea) {
    switch (area) {
      case SnackbarArea.Top_Left: return "tl";
      case SnackbarArea.Top_Middle: return "tm";
      case SnackbarArea.Top_Right: return "tr";
      case SnackbarArea.Middle_Left: return "ml";
      case SnackbarArea.Middle_Right: return "mr";
      case SnackbarArea.Bottom_Left: return "bl";
      case SnackbarArea.Bottom_Middle: return "bm";
      case SnackbarArea.Bottom_Right: return "br";
      case SnackbarArea.None: default: return "no";
    }
  }

  /**
  * Gets the corner of the screen the mouse is in, if any.
  */
  get_mouse_corner(mouseX: number, mouseY: number) {
    const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    const is_on_left = mouseX <= width * 0.15;
    const is_in_xiddle = mouseX >= width * 0.35 && mouseX <= width * 0.65;
    const is_on_right = mouseX >= width * 0.85;
    const is_on_top = mouseY <= height * 0.15;
    const is_in_yiddle = mouseY >= height * 0.35 && mouseY <= height * 0.65;
    const is_on_bottom = mouseY >= height * 0.85;

    if (is_on_left && is_on_top) {
      return SnackbarArea.Top_Left;
    }
    if (is_in_xiddle && is_on_top) {
      return SnackbarArea.Top_Middle;
    }
    if (is_on_right && is_on_top) {
      return SnackbarArea.Top_Right;
    }
    if (is_on_left && is_in_yiddle) {
      return SnackbarArea.Middle_Left;
    }
    if (is_on_right && is_in_yiddle) {
      return SnackbarArea.Middle_Right;
    }
    if (is_on_left && is_on_bottom) {
      return SnackbarArea.Bottom_Left;
    }
    if (is_in_xiddle && is_on_bottom) {
      return SnackbarArea.Bottom_Middle;
    }
    if (is_on_right && is_on_bottom) {
      return SnackbarArea.Bottom_Right;
    }
    return SnackbarArea.None;
  }

  /**
  * Returns the element from the id
  */
  get_elm_from_id(elm_id: string) {
    return document.getElementById(elm_id);
  }

  show_elements(area: SnackbarArea) {
    const sub_area = this.get_area(area);
    sub_area.forEach((elm) => {
      this.get_elm_from_id(elm)?.classList.add("active");
    })
  }

  remove_elements(area: SnackbarArea) {
    if (area == SnackbarArea.None) { return; }

    const sub_area = this.get_area(area);
    sub_area.forEach((elm) => {
      let htmlelm = this.get_elm_from_id(elm);
      // makes sure we don't just disappear when we are still using it.
      if (htmlelm?.matches(':hover')) {
        return;
      }

      htmlelm?.classList.remove("active");
    })
  }

  toggle_area(area: SnackbarArea) {
    if (this.last_area == area) {
      this.remove_elements(area);
      this.last_area = SnackbarArea.None;
      return
    }

    this.remove_elements(this.last_area);
    this.show_elements(area);
    this.last_area = area;
  }

  elements: string[][] = [
    [], [], [], [], [], [], [], []
  ]
  last_area = SnackbarArea.None;

  /**
  * Adds an area to trigger on hover in that area.
  */
  set_area(element: string, area: SnackbarArea) {
    if (area == SnackbarArea.None) {
      return;
    }

    const sub_area = this.get_area(area);
    sub_area.push(element);

    document.getElementById(`snackbar-${this.get_area_code(area)}`)?.classList.add("active");
  }

  get_area(area: SnackbarArea) {
    return this.elements[area] as string[];
  }
}

let snackbar = new SnackBar();

window.addEventListener('mousemove', (event) => {
  const area = snackbar.get_mouse_corner(event.clientX, event.clientY);
  if (area != snackbar.last_area && snackbar.last_area != SnackbarArea.None) {
    snackbar.remove_elements(snackbar.last_area);
  }

  if (area == SnackbarArea.None) {
    return;
  }

  snackbar.show_elements(area);
  snackbar.last_area = area;
})

export { snackbar, SnackbarArea }
