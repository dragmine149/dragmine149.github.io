class DateTime {
  time = 0;

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
    if (settings.get_setting("Datetime", "location")) {
      // attempts to get the location via the geolocation api
      let pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // if exists, returns
      if (pos) {
        return [pos.coords.latitude, pos.coords.longitude];
      }
    }

    // if the above fails (no location access, disabled setting) then call server to get timezone based.
    let timezones = await this.__get_timezones();
    this.verbose.log(timezones);
    this.verbose.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
    let current = timezones[Intl.DateTimeFormat().resolvedOptions().timeZone];
    return [current.lat, current.long];
  }

  // async get_sun() {
  //   const [latitude, longitude] = this.__get_location();
  //   const sunrise = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=today&formatted=0`);
  //   const data = await sunrise.json();
  //   return data.results;
  // }

  async attempt_sync_with_nature() {
    let [latitude, longitude] = await this.__get_location();
    this.verbose.log([latitude, longitude]);

    //   const sunrise = new Date(sun_data.sunrise);
    //   const sunset = new Date(sun_data.sunset);
    //   const now = new Date();

    //   const day_length = sunset - sunrise;
    //   const night_length = (24 * 60 * 60 * 1000) - day_length;
    //   const ms_since_sunrise = now - sunrise;
    //   const ms_since_sunset = now - sunset;

    //   let gradient_stage;
    //   if (now > sunrise && now < sunset) {
    //     // Day time - 36 stages
    //     gradient_stage = Math.floor((ms_since_sunrise / day_length) * 36);
    //   } else {
    //     // Night time - 24 stages
    //     if (now < sunrise) {
    //       gradient_stage = Math.floor(((ms_since_sunset + night_length) / night_length) * 24) + 36;
    //     } else {
    //       gradient_stage = Math.floor((ms_since_sunset / night_length) * 24) + 36;
    //     }
    //   }

    //   // Remove all existing gradient classes
    //   for (let i = 0; i <= 60; i++) {
    //     document.body.classList.remove(`gradient-${i}`);
    //   }

    //   // Add new gradient class
    //   document.body.classList.add(`gradient-${gradient_stage}`);

    //   // Update every minute
    //   setTimeout(() => this.sync_with_nature(), 60000);
    // }
  }
}
const date_time = new DateTime();
date_time.start_clock();
