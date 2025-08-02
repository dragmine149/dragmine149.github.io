import type { Compressed } from "compress-json";
import * as compressJSON from 'compress-json';
import { Verbose } from "./verbose.mjs";

const maxCacheTime = 7 * 24 * 60 * 60 * 1000;

const MiliSeconds = {
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
  get midnight() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return midnight.getTime() - now.getTime();
  }
};

class DragStorage {
  prefix = "";
  /**
   * Creates a new Storage instance with a specified prefix
   * @param prefix The prefix to use for all storage keys
   */
  constructor(prefix: string) {
    this.prefix = prefix;
  }

  __key_loop(callback: Function) {
    for (let index = 0; index < localStorage.length; index++) {
      callback(localStorage.key(index));
    }
  }

  /**
   * Sets an item in localStorage with the instance prefix
   * @param name - The name of the storage item
   * @param value - The value to store
   * @param cache - How long to "cache" the value for (in milliseconds). <= 0 = no cache. Max cache time of 7d
   */
  setStorage(name: string, value: string, cache: number = 0) {
    localStorage.setItem(`${this.prefix}-${name}`, value);
    if (cache <= 0) return;
    if (cache > maxCacheTime) console.warn(`Cache time for ${name} (${cache}ms) exceeds max cache time of ${maxCacheTime}ms. Setting to max cache time.`);
    this.setCache(name, Math.min(cache, maxCacheTime));
  }

  /**
   * Gets an item from localStorage by name with the instance prefix
   * @param name - The name of the storage item
   * @returns The stored value or null if not found
   */
  getStorage(name: string) {
    if (!this.validCache(name)) {
      // the cache is no longer valid, hence remove it.
      // removing it will cause the next function to return null.
      this.removeStorage(name);
    }

    return localStorage.getItem(`${this.prefix}-${name}`);
  }

  /**
   * Checks if an item exists in localStorage
   * @param name - The name of the storage item
   * @returns True if the item exists, false otherwise
   */
  hasStorage(name: string) {
    if (!this.validCache(name)) {
      // if the cache has expired, then we have no storage technically.
      return false;
    }
    return localStorage.getItem(`${this.prefix}-${name}`) != null;
  }

  /**
   * Removes an item from localStorage by name
   * @param name - The name of the storage item to remove
   */
  removeStorage(name: string) {
    localStorage.removeItem(`${this.prefix}-${name}`);
  }

  /**
   * Removes all items from localStorage that start with the instance prefix
   */
  clearPrefix() {
    this.__key_loop((key: string) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
  * Set a value to be counted as "cache". Cached values automatically expire after a given time.
  * @param name The name of the cache
  * @param length How long to store the cache for (in milliseconds)
  */
  setCache(name: string, length: number) {
    // get the cache
    let cache_details = localStorage.getItem(`cache`) ?? JSON.stringify(compressJSON.compress({}));
    let cache_compressed = JSON.parse(cache_details) as Compressed;
    // uncompress the cache
    const cache = compressJSON.decompress(cache_compressed);
    // set the cache
    cache[`${this.prefix}-${name}`] = new Date().getTime() + length;
    localStorage.setItem(`cache`, JSON.stringify(compressJSON.compress(cache)));
  }

  /**
  * Get the experiiation time (in milliseconds) of the cache.
  * @param name The name of the cache
  * @returns The millisecond value of the cache
  */
  getCache(name: string) {
    // get the cache
    let cache_details = localStorage.getItem(`cache`) ?? JSON.stringify(compressJSON.compress({}));
    let cache_compressed = JSON.parse(cache_details) as Compressed;
    // uncompress the cache
    const cache = compressJSON.decompress(cache_compressed);
    // get the cached value
    return cache[`${this.prefix}-${name}`] as number;
  }

  /**
  * Check if the cache is valid.
  * @param name The name of the cache
  * @returns The result of the check. True if no cache or valid cache, false otherwise.
  */
  validCache(name: string) {
    const date = this.getCache(name);
    if (!date) return true;
    const now = new Date();
    if (now.getTime() < date) return true;
    return false;
  }

  listStorage() {
    let items = [];
    this.__key_loop((item: string) => {
      if (item == 'cache') return;
      if (item.startsWith(this.prefix)) {
        items.push(item.replace(this.prefix + "-", ""));
      }
    });
  }
}

export { DragStorage, MiliSeconds };
