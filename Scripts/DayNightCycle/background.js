class DateTime {
  time = 0;
  clock;

  constructor() {
    this.storage = new DragStorage('datetime');
    this.verbose = new Verbose('DateTime', '#8f2a79');

    // listeners for auto updating and stuff.
    settings.add_listener("Datetime", "enabled", this.settings.setting_enable);
    settings.add_listener("Datetime", "realistic", this.settings.setting_realistic);
    settings.add_listener("Datetime", "location", this.settings.setting_location);
    settings.add_listener("Datetime", "default_state", this.settings.setting_default);
  }


  /**
  * Holds sunrise, sunset, and other sun position data for a specific day.
  * @typedef {Object} TimesCollection
  * @property {DayTimes} sunrise The times for when the sun rises
  * @property {DayTimes} sunset The times for when the sun sets
  */
  /**
  * Collection of time data for consecutive days.
  * @typedef {Object} DayTimes
  * @property {number} yesterday - Sun time for the previous day
  * @property {number} today - Sun time for the current day
  * @property {number} tomorrow - Sun time for the next day
  */

  /**
  * @typedef {Object} TimeZoneLocation
  * @property {number} lat - Latitude coordinate of the location
  * @property {number} long - Longitude coordinate of the location
  */
  /**
  * A map of locations with their coordinates.
  * @typedef { Object.< string, TimeZoneLocation >} TimezoneData
  */

  /**
  * Gets a pre-determined list of timezone data.
  * @returns {Promise<TimezoneData>}
  */
  async __get_timezones() {
    return await loader.get_contents_from_server('Scripts/DayNightCycle/timezones.json', true, loader.RETURN_TYPE.json);
  }

  /**
  * Sets classes on the body depending on the provided values.
  * website_mode is different so that the website can be read easier at night/day times.
  * @param {string} website_mode The mode of the website to show
  * @param {string} real_mode The actual mode
  */
  set_classes(website_mode, real_mode) {
    let previous_gradient = Object.values(document.body.classList).filter((k) => k.startsWith("bd_") || k.startsWith("bn_"));
    previous_gradient.forEach((k) => document.body.classList.remove(k));

    // update rest of website
    ui('mode', website_mode);
    document.getElementById("button-snacks").classList.remove(website_mode);
    document.getElementById("button-snacks").classList.add(real_mode);
  }

  /**
  * Update the classes of the body depending on the time given
  * @param {('d'|'n')} half The half of the day
  * @param {number} hour The hour in 12h format
  * @param {number} quarter The quarter in 1->4 format
  */
  update_time(half, hour, quarter) {
    // Remove all existing gradient classes
    const [website_mode, real_mode] = half == 'n' ? ['light', 'dark'] : ['dark', 'light'];
    this.set_classes(website_mode, real_mode);

    // Add the current gradient class
    document.body.classList.add(`b${half}_${hour}${quarter}`);

    this.verbose.info(`It's ${half == 'd' ? 'Daytime' : 'Nighttime'}`);
    this.verbose.log(`Gradient: b${half}_${hour}${quarter}`);
  }

  /**
  * A quick way to get the half format
  * @param {number} time The current hour
  * @returns {('d'|'n')}
  */
  __get_half_from_time(time) {
    let half = time > 18 || time <= 6 ? 'n' : 'd';
    // if morning (0->6), then time is +6 as it's the other half of night
    // if day (6->18), then time is -6 as day starts at 6 not 0
    // if evening (18->23) then time is -18 to offset the end of the day.
    let class_time = time > 6 && time <= 18 ? time - 6 : time > 18 ? time - 18 : time + 6;

    return [half, class_time];
  }

  /**
   * Set the time to now
   */
  set_to_now() {
    let now = new Date();
    let hours = now.getHours();
    let nm = now.getMinutes();
    let quarter = Math.ceil(nm / 15); // minutes are also a 1->4 range
    let [half, class_time] = this.__get_half_from_time(hours);
    this.update_time(half, class_time, quarter);
  }

  /**
   * Sync the clock to the hour by waiting til the quarter
   */
  sync_with_quarter() {
    if (settings.get_setting("Datetime", "realistic")) {
      return;
    }

    this.set_to_now();

    let now = new Date();
    let nm = now.getMinutes();
    let quarter = Math.ceil(nm / 15) * 15; // get the next quarter
    let minutes_ms_to_quarter = (quarter - nm) * 60 * 1000; // and the milliseconds time to it

    // convert the rest to milliseconds
    let seconds_ms_to_minute = (60 - now.getSeconds()) * 1000;
    let milliseconds_to_second = 1000 - now.getMilliseconds();
    let time_to_quarter = minutes_ms_to_quarter + seconds_ms_to_minute + milliseconds_to_second;

    this.verbose.log({ time_to_quarter });
    this.clock = setTimeout(this.sync_with_quarter, time_to_quarter);
  }

  /**
  * Gets the location either via the browser geolocation api or timezone decoding.
  * @returns {Promise<[number, number]>}
  */
  async __get_location() {
    // checks if we can bypass the storage check or not.
    // The bypass is for when changing settings, hence we don't have to wait a whole day to get the new values.
    let bypass_storage = false;
    if (this.storage.hasStorage("lvia")) {
      let previous_access = this.storage.getStorage("lvia");
      let loc = settings.get_setting("Datetime", "location");
      bypass_storage = loc ? previous_access != "api" : previous_access != "timezone";
    }

    // use stored, as we don't except them to move timezones that quickly...
    if (this.storage.hasStorage("location") && !bypass_storage) {
      return this.storage.getStorage("location");
    }

    if (settings.get_setting("Datetime", "location")) {
      // attempts to get the location via the geolocation api
      let pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // if exists, returns (and store)
      if (pos) {
        let [latitude, longitude] = [pos.coords.latitude, pos.coords.longitude];
        this.storage.setStorage("location", [latitude, longitude], MiliSeconds.day);
        this.storage.setStorage("lvia", "api", MiliSeconds.day);
        return [latitude, longitude];
      }
    }

    // if the above fails (no location access, disabled setting) then call server to get timezone based.
    let timezones = await this.__get_timezones();
    this.verbose.log(`User timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    let current = timezones[Intl.DateTimeFormat().resolvedOptions().timeZone]; // from a pre-deteminded list
    let [latitude, longitude] = [current.lat, current.long];
    this.storage.setStorage("location", [latitude, longitude], MiliSeconds.day);
    this.storage.setStorage("lvia", "timezone", MiliSeconds.day);
    return [latitude, longitude];
  }

  /**
  * Get the progress of days
  * @param {dayjs} now The current time
  * @param {TimesCollection} times
  * @returns {{"duration": number, "progress": number}} The duration of day (+) / night (-), and the progress.
  */
  get_progress(now, times) {
    if (now.isAfter(times.sunset.today)) {
      this.verbose.log(`Evening`);
      // After sunset but before midnight
      let nightDuration = times.sunrise.tomorrow.diff(times.sunset.today, 'hours', true);
      return {
        duration: -nightDuration,
        progress: now.diff(times.sunset.today, 'hours', true) / nightDuration
      };
    }

    if (now.isBefore(times.sunrise.today)) {
      this.verbose.log(`Morning`);
      // After midnight but before sunrise
      let nightDuration = times.sunset.yesterday.diff(times.sunrise.today, 'hours', true);
      return {
        duration: nightDuration,
        progress: times.sunset.yesterday.diff(now, 'hours', true) / nightDuration
      };
    }

    this.verbose.log(`Day`);
    // It's daytime
    let dayDuration = times.sunset.today.diff(times.sunrise.today, 'hours', true);
    return {
      duration: dayDuration,
      progress: now.diff(times.sunrise.today, 'hours', true) / dayDuration
    };
  }

  /**
    * Calculates the time until the next quarter increment based on progress
    * @param {{"duration": number, "progress": number}} progress - Current progress value (0-1)
    * @returns {number} - Time in milliseconds until next quarter increment
    */
  calculate_time_to_next_quarter(progress) {
    progress = {
      duration: Math.abs(progress.duration), // in terms of hours
      progress: progress.progress
    }

    let durationMinutes = progress.duration * 60; // how long in terms of minutes
    let quarterDuration = durationMinutes / 48; // each side is 12h, 4q/h hence 48
    let quarter = progress.progress * durationMinutes; // get the current progress in terms of minutes
    let currentQuarter = Math.floor(quarter / quarterDuration); // get the current progress in terms of quarter counts
    let nextQuarterTime = quarterDuration * (currentQuarter + 1); // get the next quarter, and find when that will happen
    let timeToNextQuarter = nextQuarterTime - quarter; // get the time remanining

    this.verbose.info({
      progress,
      durationMinutes,
      quarterDuration,
      quarter,
      currentQuarter,
      nextQuarterTime,
      timeToNextQuarter
    });

    let timeToNextQuarterMS = timeToNextQuarter * 1000 * 60; // convert to milliseconds

    this.verbose.log(`Next quarter in ${timeToNextQuarterMS}ms (${timeToNextQuarter}m)`);
    return timeToNextQuarterMS; // return
  }

  /**
  * Using Suncalc, sunc the current day/night cycle to one as close as possible to real life.
  */
  async sync_with_nature() {
    if (!settings.get_setting("Datetime", "realistic")) {
      return;
    }

    let [latitude, longitude] = await this.__get_location();
    this.verbose.log([latitude, longitude]);

    // Get the current time
    let now = dayjs();
    let yesterday = dayjs().subtract(1, 'day');
    let tomorrow = dayjs().add(1, 'day');

    let yesterdaySunCalc = SunCalc.getTimes(yesterday.toDate(), latitude, longitude);
    let todaySunCalc = SunCalc.getTimes(now.toDate(), latitude, longitude);
    let tomorrowSunCalc = SunCalc.getTimes(tomorrow.toDate(), latitude, longitude);

    /**
    * calculate a lot of times
    * @type {TimesCollection}
    */
    let times = {
      sunrise: {
        yesterday: dayjs(yesterdaySunCalc.sunrise),
        today: dayjs(todaySunCalc.sunrise),
        tomorrow: dayjs(tomorrowSunCalc.sunrise)
      },
      sunset: {
        yesterday: dayjs(yesterdaySunCalc.sunset),
        today: dayjs(todaySunCalc.sunset),
        tomorrow: dayjs(tomorrowSunCalc.sunset)
      }
    }

    this.verbose.log(now.format());

    // get the current progress in the day/night cycle. and for how long.
    let progress = this.get_progress(now, times);
    this.verbose.info(`Progress: ${progress.progress}`);
    this.verbose.info(`Duration: ${progress.duration} hours`);

    let half = (progress.duration > 0) ? `d` : `n`;
    let hour = Math.ceil(progress.progress * 12);
    let quarter = Math.floor((progress.progress * 12 - Math.floor(progress.progress * 12)) * 4) + 1;

    this.update_time(half, hour, quarter);
    this.clock = setTimeout(
      () => this.sync_with_nature(),
      this.calculate_time_to_next_quarter(progress)
    );
  }

  /**
   * Settings handler for DateTime functionality.
   * Contains handlers for all date/time related settings.
   */
  settings = {
    /**
     * Default setting handler that updates the time display based on a static value.
     * Sets the appearance to a specific time of day rather than using the real time.
     * @param {number} state - The hour value to set (0-24)
     */
    setting_default: (state) => {
      this.verbose.log("Setting default time to", state);
      switch (state) {
        case -2:
          this.set_classes("light", "dark");
          break;
        case -1:
          this.set_classes("dark", "light");
          break;
        default:
          let [half, class_time] = this.__get_half_from_time(state);
          this.update_time(half, class_time, 1);
          break;
      }
    },

    /**
     * Handler for location setting changes.
     * When location settings change, reverts to default state.
     * @param {boolean} _ - Unused parameter
     */
    setting_location: (_) => {
      return this.settings.setting_enable(settings.get_setting("Datetime", "enabled"));
    },

    /**
     * Handler for realistic time setting.
     * Toggles between nature-based time (sun position) and quarter-hour based time.
     * @param {boolean} _ - Unused parameter
     */
    setting_realistic: (_) => {
      clearTimeout(this.clock);
      this.sync_with_nature();
      this.sync_with_quarter();
    },

    /**
     * Main enable/disable handler for datetime functionality.
     * Controls whether dynamic time features are active.
     * @param {boolean} state - Whether datetime feature is enabled
     */
    setting_enable: (state) => {
      this.verbose.log(`Setting datetime feature to`, state);
      clearTimeout(this.clock);
      if (state)
        return this.settings.setting_realistic();
      return this.settings.setting_default(settings.get_setting("Datetime", "default_state"));
    }
  }
}

const date_time = new DateTime();
// date_time.settings.setting_enable(settings.get_setting("Datetime", "enabled"));
