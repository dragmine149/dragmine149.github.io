class DateTime {
  time = 0;
  clock;

  constructor() {
    this.storage = new DragStorage('datetime');
    this.verbose = new Verbose('DateTime', '#8f2a79');
  }

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
  * Gets the list of timezones
  * @returns {Promise<TimezoneData>}
  */
  async __get_timezones() {
    return await loader.get_contents_from_server('Scripts/DayNightCycle/timezones.json', true, loader.RETURN_TYPE.json);
  }

  /**
  * Set the time to now + x hours
  * @param {number} modifier The amount of time to add or subtract
  */
  set_time(modifier) {
    // update class list
    document.body.classList.remove(`g${this.time}`);
    this.time = ((this.time + modifier) % 24 + 24) % 24;
    document.body.classList.add(`g${this.time}`);

    // update rest of website
    const [website_mode, real_mode] = this.time >= 18 || this.time <= 6 ? ['light', 'dark'] : ['dark', 'light'];
    ui('mode', website_mode);
    document.getElementById("button-snacks").classList.remove(website_mode);
    document.getElementById("button-snacks").classList.add(real_mode);
  }

  /**
   * Set the time to now
   */
  set_to_now() {
    const now = new Date();
    this.set_time(now.getHours() - this.time);
  }

  /**
   * Sync the clock to the hour by waiting til the hours
   */
  __sync_to_hour() {
    const now = new Date();
    const minutes_ms_to_hour = 60 - now.getMinutes() * 60 * 1000;
    const seconds_ms_to_minute = 60 - now.getSeconds() * 1000;
    const milliseconds_to_second = 1000 - now.getMilliseconds();
    const time_to_hour = minutes_ms_to_hour + seconds_ms_to_minute + milliseconds_to_second;

    this.verbose.log(time_to_hour);
    setTimeout(() => {
      this.__clock();
    }, time_to_hour);
  }

  /**
   * Clock function that updates the time every hour
   */
  __clock() {
    this.set_to_now();
    setInterval(this.set_to_now, 3_600_000);
  }

  /**
   * external api, sync clock.
   */
  start_clock() {
    this.__sync_to_hour();
  }


  /**
  * Gets the location either via the browser geolocation api or timezone decoding.
  * @returns {Promise<[number, number]>}
  */
  async __get_location() {
    if (this.storage.hasStorage("location")) {
      return this.storage.getStorage("location");
    }

    if (settings.get_setting("Datetime", "location")) {
      // attempts to get the location via the geolocation api
      let pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // if exists, returns
      if (pos) {
        let [latitude, longitude] = [pos.coords.latitude, pos.coords.longitude];
        this.storage.setStorage("location", [latitude, longitude], MiliSeconds.day);
        return [latitude, longitude];
      }
    }

    // if the above fails (no location access, disabled setting) then call server to get timezone based.
    let timezones = await this.__get_timezones();
    this.verbose.log(timezones);
    this.verbose.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
    let current = timezones[Intl.DateTimeFormat().resolvedOptions().timeZone];
    let [latitude, longitude] = [current.lat, current.long];
    this.storage.setStorage("location", [latitude, longitude], MiliSeconds.day);
    return [latitude, longitude];
  }

  /**
  * Get the progress of days
  * @param {dayjs} now The current time
  * @param {{"yesterday": dayjs, "today": dayjs, "tomorrow": dayjs}} sunrise The sunrise times
  * @param {{"yesterday": dayjs, "today": dayjs, "tomorrow": dayjs}} sunset The sunset times
  * @returns {{"duration": number, "progress": number}} The duration of day (+) / night (-), and the progress.
  */
  get_progress(now, sunrise, sunset) {
    if (now.isAfter(sunrise.today) && now.isBefore(sunset.today)) {
      // It's daytime
      let dayDuration = sunset.today.diff(sunrise.today, 'hours', true);
      return {
        duration: dayDuration,
        progress: now.diff(sunrise.today, 'hours', true) / dayDuration
      };
    }

    if (now.isAfter(sunset.today)) {
      // After sunset but before midnight
      let nightDuration = sunrise.tomorrow.diff(sunset.today, 'hours', true);
      return {
        duration: nightDuration * -1,
        progress: now.diff(sunset.today, 'hours', true) / nightDuration
      };
    }

    if (now.isBefore(sunrise.today)) {
      // After midnight but before sunrise
      let nightDuration = sunset.yesterday.diff(sunrise.today, 'hours', true);
      return {
        duration: nightDuration * -1,
        progress: now.diff(sunset.yesterday, 'hours', true) / nightDuration
      };
    }

    // if somehow none of the above, assume 0 progress has been made.
    return {
      duration: 0,
      progress: 0
    };
  }

  async attempt_sync_with_nature() {
    let [latitude, longitude] = await this.__get_location();
    this.verbose.log([latitude, longitude]);

    // calculate a lot of times
    let yesterday = SunCalc.getTimes(new Date().setDate(new Date().getDate() - 1), latitude, longitude);
    let today = SunCalc.getTimes(new Date(), latitude, longitude);
    let tomorrow = SunCalc.getTimes(new Date().setDate(new Date().getDate() + 1), latitude, longitude);

    // Get the current time
    let now = dayjs();
    // now = now.hour(0);
    this.verbose.log(now.format());

    // Get the sunrise and sunset times
    let sunrise = {
      "today": dayjs(today.sunrise),
      "yesterday": dayjs(yesterday.sunrise),
      "tomorrow": dayjs(tomorrow.sunrise)
    };
    let sunset = {
      "today": dayjs(today.sunset),
      "tomorrow": dayjs(tomorrow.sunset),
      "yesterday": dayjs(yesterday.sunset)
    };

    // get the current progress in the day/night cycle. and for how long.
    let progress = this.get_progress(now, sunrise, sunset);
    this.verbose.info(`Progress: ${progress.progress}`);
    this.verbose.info(`Duration: ${progress.duration} hours`);

    let gradient = `b`;
    gradient += (progress.duration > 0) ? `d` : `n`;
    gradient += "_";
    let progress12 = progress.progress * 12;
    let progress12f = Math.floor(progress12);
    gradient += progress12f;
    gradient += Math.floor((progress12 - progress12f) * 4);

    this.verbose.info(`It's ${(progress.duration > 0) ? 'Daytime' : 'Nighttime'}`);
    this.verbose.log({ progress12, progress12f })
    this.verbose.log(`Gradient: ${gradient}`);

    // Remove all existing gradient classes
    let previous_gradient = Object.values(document.body.classList).filter((k) => k.startsWith("bd_") || k.startsWith("bn_"));
    previous_gradient.forEach((k) => document.body.classList.remove(k));

    // Add the current gradient class
    document.body.classList.add(gradient);
    this.time = gradient;
  }
}

const date_time = new DateTime();
date_time.start_clock();
