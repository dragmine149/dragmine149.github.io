const maxCacheTime = 7 * 24 * 60 * 60 * 1000;

const MiliSeconds = {
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
};

class DragStorage {
  prefix = "";
  /**
   * Creates a new Storage instance with a specified prefix
   * @param {string} prefix - The prefix to use for all storage keys
   */
  constructor(prefix) {
    this.prefix = prefix;
  }

  /**
   * Sets an item in localStorage with the instance prefix
   * @param {string} name - The name of the storage item
   * @param {string} value - The value to store
   * @param {number} cache - How long to "cache" the value for (in milliseconds). <= 0 = no cache. Max cache time of 7d
   */
  setStorage(name, value, cache = 0) {
    localStorage.setItem(`${this.prefix}-${name}`, value);
    if (cache <= 0) return;
    if (cache > maxCacheTime) console.warn(`Cache time for ${name} (${cache}ms) exceeds max cache time of ${maxCacheTime}ms. Setting to max cache time.`);
    this.setCache(name, Math.max(cache, maxCacheTime));
  }

  /**
   * Gets an item from localStorage by name with the instance prefix
   * @param {string} name - The name of the storage item
   * @returns {string|null} The stored value or null if not found
   */
  getStorage(name) {
    if (!this.validCache(name)) {
      // the cache is no longer valid, hence remove it.
      // removing it will cause the next function to return null.
      this.removeStorage(name);
    }

    return localStorage.getItem(`${this.prefix}-${name}`);
  }

  /**
   * Checks if an item exists in localStorage
   * @param {string} name - The name of the storage item
   * @returns {boolean} True if the item exists, false otherwise
   */
  hasStorage(name) {
    return localStorage.getItem(`${this.prefix}-${name}`) != null;
  }

  /**
   * Removes an item from localStorage by name
   * @param {string} name - The name of the storage item to remove
   */
  removeStorage(name) {
    localStorage.removeItem(`${this.prefix}-${name}`);
  }

  /**
   * Removes all items from localStorage that start with the instance prefix
   */
  clearPrefix() {
    for (let item = 0; item < localStorage.length; item++) {
      let key = localStorage.key(item);
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
  * Set a value to be counted as "cache". Cached values automatically expire after a given time.
  * @param {string} name The name of the cache
  * @param {number} length How long to store the cache for (in milliseconds)
  */
  setCache(name, length) {
    // get the cache
    let cache_details = localStorage.getItem(`cache`) ?? JSON.stringify(compressJSON.compress({}));
    cache_details = JSON.parse(cache_details);
    // uncompress the cache
    const cache = compressJSON.decompress(cache_details);
    // set the cache
    cache[`${this.prefix}-${name}`] = new Date().getTime() + length;
    localStorage.setItem(`cache`, JSON.stringify(compressJSON.compress(cache)));
  }

  /**
  * Get the experiiation time (in milliseconds) of the cache.
  * @param {string} name The name of the cache
  * @returns {number} The millisecond value of the cache
  */
  getCache(name) {
    // get the cache
    let cache_details = localStorage.getItem(`cache`) ?? JSON.stringify(compressJSON.compress({}));
    cache_details = JSON.parse(cache_details);
    // uncompress the cache
    const cache = compressJSON.decompress(cache_details);
    // get the cached value
    return cache[`${this.prefix}-${name}`];
  }

  /**
  * Check if the cache is valid.
  * @param {string} name The name of the cache
  * @returns {boolean} The result of the check. True if no cache or valid cache, false otherwise.
  */
  validCache(name) {
    const date = this.getCache(name);
    if (!date) return true;
    const now = new Date();
    if (now.getTime() < date) return true;
    return false;
  }

  listStorage() {
    let items = [];
    for (let item = 0; item < localStorage.length; item++) {
      let key = localStorage.key(item);
      if (key == 'cache') continue;
      if (key.startsWith(this.prefix)) {
        items.push(key.replace(this.prefix + "-", ""));
      }
    }
    return items;
  }
}
