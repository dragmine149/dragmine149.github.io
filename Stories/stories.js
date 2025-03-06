class Stories {

  /** @type {Object.<string, {
    description: string,
    author: string,
    tags?: string[],
    status: 'in-progress' | 'completed' | 'abandoned',
    chapters: Object.<string, string>
  }>} */
  stories;
  /** @type {Verbose} */
  verbose;
  /** @type {Map<string, HTMLElement>} */
  cache;

  constructor() {
    this.stories = [];
    this.__get_stories();
    this.verbose = new Verbose('Stories', "#8aff57");
    this.cache = new Map();
    this.storage = new DragStorage('Stories');

    customHistory.add_listener('Stories', (v) => {
      this.__load_stories();
    });

    (async () => {
      await this.__load_stories();
    })();

  }

  __get_elm() {
    return document.getElementById('stories');
  }
  __get_story() {
    return document.getElementById('story');
  }

  async __get_stories() {
    this.stories = await loader.get_contents_from_server(`Stories/list.json`, false, loader.RETURN_TYPE.json);
  }

  async __load_stories() {
    this.verbose.log('Loading stories...');
    this.verbose.log(this.stories);
    if (this.stories.length === 0) {
      await this.__get_stories();
    }

    Object.keys(this.stories).forEach(key => {
      if (key.startsWith("$")) {
        return;
      }

      let story_elm = this.cache.get(key);
      if (story_elm) {
        this.__get_elm().appendChild(story_elm);
        return;
      }

      let article = document.createElement('article');
      let title = document.createElement('h5');
      title.textContent = key;
      let description = document.createElement('p');
      description.textContent = this.stories[key].description;
      let progress = document.createElement('progress');
      progress.value = this.storage.getStorage(`${key}-progress`) || 0;
      progress.max = this.stories[key].status === 'completed' ? Object.keys(this.stories[key].chapters).at(-1) : progress.value * 2;
      progress.disabled = true;

      let chapter_select = document.createElement('select');
      Object.keys(this.stories[key].chapters).forEach(chapter => {
        let option = document.createElement('option');
        option.value = chapter;
        option.textContent = chapter;
        chapter_select.appendChild(option);
      });
      chapter_select.value = progress.value;
      chapter_select.addEventListener('change', () => {
        this.__load_story(key, chapter_select.value);
      });

      let read_first = document.createElement('button');
      read_first.textContent = 'Read First';
      read_first.addEventListener('click', () => {
        this.__load_story(key, Object.keys(this.stories[key].chapters).at(0));
      });

      let read_last = document.createElement('button');
      read_last.textContent = 'Read Latest';
      read_last.addEventListener('click', () => {
        this.__load_story(key, -1);
      });

      let div = document.createElement('div');
      div.appendChild(read_first);
      div.appendChild(chapter_select);
      div.appendChild(read_last);

      article.appendChild(title);
      article.appendChild(description);
      article.appendChild(div);
      article.appendChild(progress);

      article.addEventListener('click', () => {
        this.__load_story(key, -1);
      });

      this.__get_elm().appendChild(article);
      this.cache.set(key, article);
    });

    this.__visible(true);
  }

  async __load_story(story, chapter) {
    if (chapter === -1) {
      chapter = Object.keys(this.stories[story].chapters).at(-1);
    }
    this.verbose.log(`Loading story ${story} chapter ${chapter}`);

    let data = await loader.get_contents_from_server(`Stories/${this.stories[story].chapters[chapter]}`);

    // this.__get_story().innerText = data;// Create base table or get existing one
    let container = document.createElement('div');
    container.className = 'story-container';
    this.__get_story().appendChild(container);

    // Split data into lines for processing
    const lines = data.split('\n');

    let currentTable = null;
    let isNewScene = true;

    lines.forEach(line => {
      // Empty line indicates scene change
      if (line.trim() === '') {
        isNewScene = true;
        return;
      }

      // Handle scene location information
      if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
        const locationInfo = document.createElement('div');
        locationInfo.className = 'scene-location';
        locationInfo.textContent = line.trim();
        container.appendChild(locationInfo);
        return;
      }

      // Create a new table for a new scene
      if (isNewScene) {
        currentTable = document.createElement('table');
        currentTable.className = 'dialogue-table';
        container.appendChild(currentTable);
        isNewScene = false;
      }

      // Handle character dialogue lines
      const dialogueMatch = line.match(/^(.*?):\s+(.*?)$/);
      if (dialogueMatch) {
        const character = dialogueMatch[1].trim();
        const dialogue = dialogueMatch[2].trim();

        const row = document.createElement('tr');

        const characterCell = document.createElement('td');
        characterCell.className = 'character-name';
        characterCell.textContent = character;

        const dialogueCell = document.createElement('td');
        dialogueCell.className = 'dialogue-text';
        dialogueCell.textContent = dialogue;

        row.appendChild(characterCell);
        row.appendChild(dialogueCell);
        currentTable.appendChild(row);
      } else if (line.trim() !== '') {
        // Handle narration or other non-dialogue text
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.className = 'narration';
        cell.textContent = line.trim();
        row.appendChild(cell);
        currentTable.appendChild(row);
      }
    });

    // Store progress
    this.storage.setStorage(`${story}-progress`, chapter);

    this.__visible(false);
  }

  __visible(state) {
    this.__get_elm().hidden = !state;
    this.__get_story().hidden = state;
  }
}

let stories = new Stories();
