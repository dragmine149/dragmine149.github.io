function markedLocalTime() {
  function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = seconds / 31536000;
    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  }

  function time_with_0(time) {
    if (time < 10) {
      return `0${time}`;
    }
    return `${time}`;
  }

  function format_time(time, format) {
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Janurary', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const t = new Date(time * 1000);
    switch (format) {
      case 't':
        return `${time_with_0(t.getHours())}:${time_with_0(t.getMinutes())}`;
      case 'T':
        return `${t.toLocaleTimeString()}`;
      case 'd':
        return `${t.toLocaleDateString()}`;
      case 'D':
        return `${time_with_0(t.getDate())} ${months[t.getMonth()]} ${t.getFullYear()}`;
      case 'F':
        return `${weekDays[t.getDay()]} ${time_with_0(t.getDate())} ${months[t.getMonth()]} ${t.getFullYear()} at ${time_with_0(t.getHours())}:${time_with_0(t.getMinutes())}`;
      case 'R':
        return `${timeSince(t)}`;
      case 'f':
        return `${time_with_0(t.getDate())} ${months[t.getMonth()]} ${t.getFullYear()} at ${time_with_0(t.getHours())}:${time_with_0(t.getMinutes())}`;
      default:
        return t.toLocaleString();
    }
  }

  return {
    extensions: [{
      name: 'localtime',
      level: 'inline',
      start(src) {
        const start = src.match(/<t:/)?.index;
        return start === undefined || (start > 0 && src[start - 1] === '`') ? undefined : start;
      },
      tokenizer(src, tokens) {
        const rule = /^<t:(\d*)(:([tTdDfFR]))?>/;
        const match = rule.exec(src);

        return (match) ? {
          type: 'localtime',
          raw: match[0],
          time: Number(match[1]),
          format: match[3] == undefined ? 'f' : match[3],
        } : undefined
      },
      renderer(token) {
        return `<code>${format_time(token.time, token.format)}</code>`;
      },
    }],
  }
}
/*
const description = {
  name: 'description',
  level: 'inline',                                 // Is this a block-level or inline-level tokenizer?
  start(src) { return src.match(/:/)?.index; },    // Hint to Marked.js to stop and check for a match
  tokenizer(src, tokens) {
    const rule = /^:([^:\n]+):([^:\n]*)(?:\n|$)/;  // Regex for the complete token, anchor to string start
    const match = rule.exec(src);
    if (match) {
      return {                                         // Token to generate
        type: 'description',                           // Should match "name" above
        raw: match[0],                                 // Text to consume from the source
        dt: this.lexer.inlineTokens(match[1].trim()),  // Additional custom properties, including
        dd: this.lexer.inlineTokens(match[2].trim())   //   any further-nested inline tokens
      };
    }
  },
  renderer(token) {
    return `\n < dt > ${ this.parser.parseInline(token.dt) }</dt > <dd>${this.parser.parseInline(token.dd)}</dd>`;
  },
  childTokens: ['dt', 'dd'],                 // Any child tokens to be visited by walkTokens
};

*/

class Blog {
  constructor() {
    page.listen_to_state_pop("blog", v => this.load_blog(v, false));
    this.initiate_blog_load();
  }
  initiate_blog_load() {
    this.set_blank_blog();

    const blog_loaded = this.load_blog_from_url();
    if (!blog_loaded) {
      this.load_blog_list();
    }
  }
  set_blank_blog() {
    let c_state = history.state;
    c_state["blog"] = "";
    history.replaceState(c_state, "", location);
  }

  blog_loaded = false;

  /**
  * View the blog
  * @param {Bool} list
  */
  blog_viewer(list = false) {
    console.log(`Blog viewer. List: ${list}`);
    const blog_content = document.getElementById('blog_content');
    const blog_list = document.getElementById('blog_list');

    blog_list.hidden = list;
    blog_content.hidden = !list;
    blog_content.scrollTo(0, 0);
  }

  async load_blog(blog_page, history_push = true) {
    if (blog_page == "") {
      this.load_blog_list();
      return;
    }

    console.log(`Loading blog: ${blog_page}`);
    // construct the URL
    const page_location = page.get_current_page() + `Blog/Posts/${blog_page}.md`;
    let blog_details = await page.__get_content(page_location);
    // using marked, load the blog post into the page
    let marked = window.marked;
    document.getElementById('blog_content').innerHTML = new marked.Marked()
      .use(markedLocalTime())
      .use(markedCustomHeadingId())
      .use(markedFootnote())
      .use(markedHighlight.markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, lang, info) {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        }
      }))
      .parse(blog_details.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""));

    // change the URL, history and display the blog on the page.
    if (history_push) {
      page.push_state_to_history(page.get_current_subpage(), {
        "blog": blog_page
      }, `?blog=${blog_page}`);
    }
    this.blog_viewer(true);
    this.blog_loaded = true;
  }

  async load_blog_list() {
    const url = new URL(location);
    const page_location = url.origin + "/Blog/list.json";
    let list = await page.__get_content(page_location);
    let json_list = JSON.parse(list);
    this.blog_list = json_list;

    Object.values(json_list).forEach((v) => {
      if (document.getElementById(`blog-${v.date}`)) {
        return;
      }

      const elm = document.createElement('article');
      const title = document.createElement('h5');
      const preview = document.createElement('p');
      const categories = document.createElement('nav');

      elm.id = `blog-${v.date}`;
      elm.appendChild(title);
      elm.appendChild(preview);
      elm.appendChild(categories);

      title.innerText = v.date;
      preview.innerText = v.preview;

      document.getElementById('blog_list').appendChild(elm);

      v.categories.forEach((category) => {
        const fake_btn = document.createElement('a');
        fake_btn.classList.add("button");
        categories.appendChild(fake_btn);
        fake_btn.innerText = category;
      });

      elm.onclick = () => {
        console.log(`Clicked elm: ${v.date}`);
        blog.load_blog(v.date);
      }
    });

    this.blog_viewer(false);
    this.blog_loaded = false;
    this.set_blank_blog();
  }

  load_blog_from_url() {
    const url = new URL(location);
    const blog = url.searchParams.get('blog');
    if (blog == null) {
      return false;
    }
    this.load_blog(blog);
    return true;
  }
}

let blog = new Blog();

function blog_loader() {
  blog.initiate_blog_load();
}

// Source: https://adventofcode.com/
// Triple click to select code blocks
window.addEventListener('click', function (e, s, r) {
  if (e.target.nodeName === 'CODE' && e.detail === 3) {
    s = window.getSelection();
    s.removeAllRanges();
    r = document.createRange();
    r.selectNodeContents(e.target);
    s.addRange(r);
  }
});
