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
   */
  setStorage(name, value) {
    localStorage.setItem(`${this.prefix}-${name}`, value);
  }

  /**
   * Gets an item from localStorage by name with the instance prefix
   * @param {string} name - The name of the storage item
   * @returns {string|null} The stored value or null if not found
   */
  getStorage(name) {
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
      const key = localStorage.key(item);
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
}
