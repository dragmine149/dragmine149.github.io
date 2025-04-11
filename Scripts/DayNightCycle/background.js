class DateTime {
  clock;

  constructor() {
    this.storage = new DragStorage('datetime');
    this.verbose = new Verbose('DateTime', '#8f2a79');

    // listeners for auto updating and stuff.
    settings.add_listener("Datetime", "enabled", this.settings.setting_enable);
    settings.add_listener("Datetime", "realistic", this.settings.setting_realistic);
    settings.add_listener("Datetime", "location", this.settings.setting_realistic);
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
  * @param {boolean} auto Controls whether the inner elements have the same colours scheme as the rest of the page when day/night is enabled. Enabled they have the same. Disabled they have the opposite to make better readability.
  */
  set_classes(website_mode, real_mode, auto = false) {
    let previous_gradient = Object.values(document.body.classList).filter((k) => k.startsWith("bd_") || k.startsWith("bn_"));
    previous_gradient.forEach((k) => document.body.classList.remove(k));

    // update rest of website
    ui('mode', website_mode);
    document.getElementById("button-snacks").classList.remove(website_mode);
    document.getElementById("button-snacks").classList.add(real_mode);

    document.querySelectorAll('[dark-is-dark]').forEach((element) => {
      let dark_is_dark = element.getAttribute('dark-is-dark') || website_mode;

      element.classList.remove(dark_is_dark);
      if (!auto) {
        element.classList.add(real_mode);
      }
      element.setAttribute('dark-is-dark', real_mode);
    });
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
    this.set_classes(website_mode, real_mode, true);

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
    let class_time = time > 6 && time <= 18 ? time - 6 : (time > 18 ? time - 18 : time + 6);

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
    if (settings.get_setting("Datetime", "location")) {
      // attempts to get the location via the geolocation api
      let pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // if exists, returns (and store)
      if (pos) {
        let [latitude, longitude] = [pos.coords.latitude, pos.coords.longitude];
        this.storage.setStorage("lvia", "api", MiliSeconds.day);
        return [latitude, longitude];
      }
    }

    // if the above fails (no location access, disabled setting) then call server to get timezone based.
    let timezones = await this.__get_timezones();
    this.verbose.log(`User timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    let current = timezones[Intl.DateTimeFormat().resolvedOptions().timeZone]; // from a pre-deteminded list
    let [latitude, longitude] = [current.lat, current.long];
    this.storage.setStorage("lvia", "timezone", MiliSeconds.day);
    return [latitude, longitude];
  }

  /**
  * Get the times for a given location
  * @returns {Promise<TimesCollection>} A list of times in dayjs format.
  */
  async __get_times() {
    // checks if we can bypass the storage check or not.
    // The bypass is for when changing settings, hence we don't have to wait a whole day to get the new values.
    let bypass_storage = false;
    if (this.storage.hasStorage("lvia")) {
      let previous_access = this.storage.getStorage("lvia");
      let loc = settings.get_setting("Datetime", "location");
      bypass_storage = loc ? previous_access != "api" : previous_access != "timezone";
    }

    // If we can't bypass storage, and we have storage. prefer that instead.
    if (!bypass_storage && this.storage.hasStorage("times")) {
      let data = JSON.parse(this.storage.getStorage("times"));
      data.sunrise.yesterday = dayjs(data.sunrise.yesterday);
      data.sunrise.today = dayjs(data.sunrise.today);
      data.sunrise.tomorrow = dayjs(data.sunrise.tomorrow);
      data.sunset.yesterday = dayjs(data.sunset.yesterday);
      data.sunset.today = dayjs(data.sunset.today);
      data.sunset.tomorrow = dayjs(data.sunset.tomorrow);
      return data;
    }

    let [latitude, longitude] = await this.__get_location();

    // Get the current time
    let now = dayjs();
    let yesterday = now.subtract(1, 'day');
    let tomorrow = now.add(1, 'day');

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

    this.storage.setStorage("times", JSON.stringify(times), MiliSeconds.midnight);
    return times;
  }

  format_times(times) {
    times.sunrise.yesterday = times.sunrise.yesterday.format();
    times.sunrise.today = times.sunrise.today.format();
    times.sunrise.tomorrow = times.sunrise.tomorrow.format();
    times.sunset.yesterday = times.sunset.yesterday.format();
    times.sunset.today = times.sunset.today.format();
    times.sunset.tomorrow = times.sunset.tomorrow.format();
    return times;
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
    // this.verbose.trace(`Tracing of nature sync`);

    if (!settings.get_setting("Datetime", "realistic")) {
      return;
    }

    // get the times to do calculations with
    let now = dayjs();
    let times = await this.__get_times();
    this.verbose.log(now.format());
    this.verbose.log(times);

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
      if (settings.get_setting("Datetime", "enabled")) {
        return;
      }
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
     * Handler for realistic time setting.
     * Toggles between nature-based time (sun position) and quarter-hour based time.
     * @param {boolean} _ - Unused parameter
     */
    setting_realistic: (_) => {
      if (!settings.get_setting("Datetime", "enabled")) {
        return;
      }
      clearTimeout(this.clock);
      this.sync_with_nature();
      this.sync_with_quarter();
    },

    /**
     * Main enable/disable handler for datetime functionality.
     * Controls whether dynamic time features are active.
     * @param {boolean} _ - Unused parameter
     */
    setting_enable: (_) => {
      clearTimeout(this.clock);
      this.settings.setting_realistic();
      this.settings.setting_default(settings.get_setting("Datetime", "default_state"));
    }
  }
}

const date_time = new DateTime();
