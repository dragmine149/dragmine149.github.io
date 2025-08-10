import { Marked } from "marked";
import customHeadingId from "marked-custom-heading-id";
import markedFootnote from "marked-footnote";
import { markedHighlight } from "marked-highlight";
/**
 * Class to handle Markdown processing and rendering
 */
class Markdown {
  /** Settings for Markdown processing */
  #settings: MarkdownSettings;
  /** DOM element to render markdown into */
  #obj: HTMLElement | undefined;
  /** Marked instance for markdown parsing */
  #marked: Marked;
  /** Have we already made the markdown settings thingy. */
  #made: boolean = false;

  /**
   * Creates a new Markdown processor
   * @param settings - Settings for markdown processing
   * @param obj - DOM element to render markdown into
   */
  constructor(settings: MarkdownSettings, obj?: HTMLElement) {
    settings = Object.assign({}, defaultMarkdownSettings(), settings);

    this.#settings = Object.freeze(settings);
    this.#obj = obj;
    this.#marked = new Marked();
  }

  /**
   * Returns the appropriate marked extension based on type
   * @param type - Type of marked extension to use
   * @returns Marked extension instance
   */
  #use(type: string): Object {
    // Anything with `@ts-ignore` is because it's externally loaded not via an bun package.
    switch (type) {
      case "markedLocalTime":
        // @ts-ignore
        return markedLocalTime();
      case "markedCustomHeadingId":
        return customHeadingId();
      case "markedFootnote":
        return markedFootnote();
      case "markedImprovedImage":
        // @ts-ignore
        return markedImprovedImage(this.#settings.markedRemoteImage ? 'https://raw.githubusercontent.com/dragmine149/dragmine149.github.io/refs/heads/main' : '');
      case "markedHighlight":
        return markedHighlight({
          emptyLangClass: 'hljs',
          langPrefix: 'hljs language-',
          highlight(code, lang, info) {
            // @ts-ignore
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            // @ts-ignore
            return hljs.highlight(code, { language }).value;
          }
        });
      case "markedCenterText":
        // @ts-ignore
        return markedCenterText();
      case "markedLocalLink":
        // @ts-ignore
        return markedLocalLink(this.#settings.markedLocalLink, "dragmine149.github.io");
      default:
        return {}
    }
  }

  /**
   * Creates and configures a marked instance with the current settings
   * @returns Configured marked instance
   * @private
   */
  #make_marked() {
    if (this.#made) return this.#marked;
    Object.entries(this.#settings).forEach((data) => {
      if (!data[1]) {
        return;
      }
      this.#marked.use(this.#use(data[0]));
    });
    this.#made = true;
    return this.#marked;
  }

  /**
   * Parses markdown text and renders it.
   * @param text - Markdown text to parse
   */
  parse(text: string) {
    if (this.#obj == undefined) {
      console.warn("Undefined object! Can't parse anything.");
      return;
    }
    this.parse_to_obj(text, this.#obj);
  }

  /**
   * Parses markdown text and renders it.
   * @param text - Markdown text to parse
   * @param obj - The object to render to.
   */
  parse_to_obj(text: string, obj: HTMLElement) {
    this.#make_marked();
    text = text.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "");
    obj.innerHTML = this.#marked.parse(text) as string;
  }

  set_obj(obj: HTMLElement) {
    this.#obj = obj;
  }

  scroll_top() {
    this.#obj?.scrollTo(0, 0);
  }
}

/**
 * Settings interface for Markdown class
 */
type MarkdownSettings = {
  /**
   * Enable using `<t:X:F>` to render time in viewer local time
   */
  markedLocalTime?: boolean;

  /**
   * Enable custom heading IDs
   */
  markedCustomHeadingId?: boolean;

  /**
   * Enable footnotes
   */
  markedFootnote?: boolean;

  /**
   * Enable Images rendering inside a <div class="img"> instead of normal rendering.
   */
  markedImprovedImage?: boolean;

  /**
   * Gets images from the server `raw.githubusercontent` instead of our server `dragmine149.github.io`
   */
  markedRemoteImage?: boolean;

  /**
   * Enable code block highlighting.
   */
  markedHighlight?: boolean;

  /**
   * Upon clicking a link on this site, do this custom function instead of a redirect.
   */
  markedLocalLink?: (url: URL) => boolean;

  /**
   * Extra markdown for centering / shifting text to the right.
   */
  markedCenterText?: boolean;
}

/**
 * Provides a default configuration for MarkdownSettings.
 */
function defaultMarkdownSettings(): MarkdownSettings {
  return {
    markedLocalTime: false,
    markedCustomHeadingId: false,
    markedFootnote: false,
    markedImprovedImage: false,
    markedRemoteImage: false,
    markedHighlight: false,
    markedLocalLink: (url: URL) => false,
    markedCenterText: false
  }
};

export { Markdown, MarkdownSettings };
