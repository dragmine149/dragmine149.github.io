class typewritter {
  constructor(elm) {
    this.elm = elm;
  }

  /**
  * @param {HTMLElement} elm The element to do the effect on. Must have `.innerText` property
  * @param {String} end The text to end up at (uses the current value if empty)
  * @param {number} time How long to take to complete the whole cycle (in ms)
  */
  start(end = "", time = 5000) {
    if (end.length == 0) {
      end = this.elm.innerText;
    }

    this.elm.innerText = "";
    this.loop(end, time / end.length);
  };

  /**
  *
  * @param {String} string
  * @param {number} timeout
  */
  loop(string, timeout) {
    this.elm.innerText += string[0];
    string = string.slice(1, string.length);

    if (string.length != 0) {
      setTimeout(() => {
        this.loop(string, timeout);
      }, timeout + Math.random());
    }
  };
}
