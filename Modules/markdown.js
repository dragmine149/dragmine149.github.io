/**
 * Class to handle Markdown processing and rendering
 */
class Markdown {
  /** @type {markdownSettings} Settings for Markdown processing */
  __settings;
  /** @type {HTMLElement} DOM element to render markdown into */
  __obj;
  /** @type {marked.Marked} Marked instance for markdown parsing */
  __marked;

  /**
   * Creates a new Markdown processor
   * @param {markdownSettings} settings - Settings for markdown processing
   * @param {HTMLElement} obj - DOM element to render markdown into
   */
  constructor(settings, obj) {
    settings = Object.assign({}, markdownSettings, settings);

    this.__settings = settings;
    this.__obj = obj;
  }

  __load_marked() {
    if (window.marked != undefined) {
      this.__marked = new window.marked.Marked();
    }
  }

  /**
   * Returns the appropriate marked extension based on type
   * @param {string} type - Type of marked extension to use
   * @returns {Object} Marked extension instance
   * @private
   */
  __use(type) {
    switch (type) {
      case "markedLocalTime":
        return markedLocalTime();
      case "markedCustomHeadingId":
        return markedCustomHeadingId();
      case "markedFootnote":
        return markedFootnote();
      case "markedImprovedImage":
        return markedImprovedImage(this.__settings.markedRemoteImage ? 'https://raw.githubusercontent.com/dragmine149/dragmine149.github.io/refs/heads/main' : '');
      case "markedHighlight":
        return markedHighlight.markedHighlight({
          emptyLangClass: 'hljs',
          langPrefix: 'hljs language-',
          highlight(code, lang, info) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
          }
        });
      case "markedCenterText":
        return markedCenterText();
      default:
        return {}
    }
  }

  /**
   * Creates and configures a marked instance with the current settings
   * @returns {marked.Marked} Configured marked instance
   * @private
   */
  __make_marked() {
    this.__load_marked();
    let local_marked = this.__marked;
    Object.entries(this.__settings).forEach((data) => {
      if (!data[1]) {
        return;
      }
      local_marked.use(this.__use(data[0]));
    })
    return local_marked;
  }

  /**
   * Parses markdown text and renders it.
   * @param {string} text - Markdown text to parse
   */
  parse(text) {
    this.parse_to_obj(text, this.__obj);
  }

  /**
   * Parses markdown text and renders it.
   * @param {string} text - Markdown text to parse
   * @param {HTMLElement} obj - The object to render to.
   */
  parse_to_obj(text, obj) {
    text = text.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "");
    obj.innerHTML = this.__make_marked().parse(text);
  }


  set_obj(obj) {
    this.__obj = obj;
  }
}

/**
 * Settings interface for Markdown class
 * @typedef {Object} markdownSettings
 * @property {boolean} markedLocalTime - Enable using `<t:X:F>` to render time in viewer local time
 * @property {boolean} markedCustomHeadingId - Enable custom heading IDs
 * @property {boolean} markedFootnote - Enable footnotes
 * @property {boolean} markedImprovedImage - Enable Images rendering inside a <div class="img"> instead of normal rendering.
 * @property {boolean} markedRemoteImage - Gets images from the server `raw.githubusercontent` instead of our server `dragmine149.github.io`
 * @property {boolean} markedHighlight - Enable code block highlighting.
 */
const markdownSettings = {
  markedLocalTime: false,
  markedCustomHeadingId: false,
  markedFootnote: false,
  markedImprovedImage: false,
  markedRemoteImage: false,
  markedHighlight: false,
  markedCenterText: false,
};
