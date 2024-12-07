export const AREA = {
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
Object.freeze(AREA);

/**
* Gets the corner of the screen the mouse is in, if any.
* @param {number} mouseX
* @param {number} mouseY
* @returns {bool}
*/
function get_mouse_corner(mouseX, mouseY) {
  const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  const is_on_left = mouseX <= width * 0.15;
  const is_in_xiddle = mouseX >= width * 0.35 && mouseX <= width * 0.65;
  const is_on_right = mouseX >= width * 0.85;
  const is_on_top = mouseY <= height * 0.15;
  const is_in_yiddle = mouseY >= height * 0.35 && mouseY <= height * 0.65;
  const is_on_bottom = mouseY >= height * 0.85;

  if (is_on_left && is_on_top) {
    return AREA.Top_Left;
  }
  if (is_in_xiddle && is_on_top) {
    return AREA.Top_Middle;
  }
  if (is_on_right && is_on_top) {
    return AREA.Top_Right;
  }
  if (is_on_left && is_in_yiddle) {
    return AREA.Middle_Left;
  }
  if (is_on_right && is_in_yiddle) {
    return AREA.Middle_Right;
  }
  if (is_on_left && is_on_bottom) {
    return AREA.Bottom_Left;
  }
  if (is_in_xiddle && is_on_bottom) {
    return AREA.Bottom_Middle;
  }
  if (is_on_right && is_on_bottom) {
    return AREA.Bottom_Right;
  }
  return AREA.None;
}

/** @type {HTMLElement[][]} */
let elements = [
  [], [], [], [], [], [], [], []
]
/** @type {AREA} */
let last_area = AREA.None;

window.addEventListener('mousemove', (event) => {
  const area = get_mouse_corner(event.clientX, event.clientY);
  if (area != last_area && last_area != AREA.None) {

    /** @type {HTMLElement[]} */
    const sub_area = elements[last_area];
    sub_area.forEach((elm) => {
      // makes sure we don't just disapear when we are still using it.
      if (elm.matches(':hover')) {
        return;
      }

      elm.classList.remove("active");
    })
  }

  if (area == AREA.None) {
    return;
  }

  /** @type {HTMLElement[]} */
  const sub_area = elements[area];
  sub_area.forEach((elm) => {
    elm.classList.add("active");
  })

  last_area = area;
})

/**
* Adds an area to trigger on hover in that area.
* @param {HTMLElement} element
* @param {AREA} area
*/
export function set_area(element, area) {
  /** @type {HTMLElement[]} */
  const sub_area = elements[area];
  sub_area.push(element);
}
