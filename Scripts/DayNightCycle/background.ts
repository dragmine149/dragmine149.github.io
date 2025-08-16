import { DragStorage, MiliSeconds } from '../storage';
import { Verbose } from '../verbose.mjs';
import { settings, SettingType } from '../Settings/settings';
import { loader, RETURN_TYPE } from '../loader/loader';

declare function ui(arg0: string, arg1: string): void;

/**
* Holds sunrise, sunset, and other sun position data for a specific day.
*/
interface TimesCollection {
  sunrise: DayTimes;
  sunset: DayTimes;
}

/**
* Collection of time data for consecutive days.
*/
interface DayTimes {
  yesterday: Date;
  today: Date;
  tomorrow: Date;
}

/**
* Holds sunrise, sunset, and other sun position data for a specific day.
*/
interface TimesCollectionString {
  sunrise: DayTimesString;
  sunset: DayTimesString;
}

/**
* Collection of time data for consecutive days.
*/
interface DayTimesString {
  yesterday: string;
  today: string;
  tomorrow: string;
}

interface TimeZoneLocation {
  lat: number;
  long: number;
}


/**
* A map of locations with their coordinates.
 */
type TimezoneData = {
  [key: string]: TimeZoneLocation;
};

type Half = ('d' | 'n');


function timeDiffHour(a: Date, b: Date) {
  return (a.getTime() - b.getTime()) / 1000 / 60 / 60;
}
function modifyDay(day: Date, operation: number) {
  return new Date(day.getTime() + (operation * 1000 * 60 * 60 * 24));
}
function isAfter(a: Date, b: Date) {
  return a.getTime() > b.getTime();
}
function isBefore(a: Date, b: Date) {
  return a.getTime() < b.getTime();
}


class DateTime {
  clock: number;
  storage: DragStorage;
  verbose: Verbose;

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
  * Gets a pre-determined list of timezone data.
  */
  async __get_timezones(): Promise<TimezoneData> {
    return await loader.get_contents_from_server('Scripts/DayNightCycle/timezones.json', RETURN_TYPE.json);
  }

  /**
  * Sets classes on the body depending on the provided values.
  * website_mode is different so that the website can be read easier at night/day times.
  * @param website_mode The mode of the website to show
  * @param real_mode The actual mode
  * @param auto Controls whether the inner elements have the same colours scheme as the rest of the page when day/night is enabled. Enabled they have the same. Disabled they have the opposite to make better readability.
  */
  set_classes(website_mode: string, real_mode: string, auto: boolean = false) {
    let previous_gradient = Object.values(document.body.classList).filter((k) => k.startsWith("bd_") || k.startsWith("bn_"));
    previous_gradient.forEach((k) => document.body.classList.remove(k));

    // update rest of website
    ui('mode', website_mode);
    document.getElementById("button-snacks")?.classList.remove(website_mode);
    document.getElementById("button-snacks")?.classList.add(real_mode);

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
  * @param half The half of the day
  * @param hour The hour in 12h format
  * @param quarter The quarter in 1->4 format
  */
  update_time(half: Half, hour: number, quarter: number) {
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
  * @param time The current hour
  */
  __get_half_from_time(time: number): [Half, number] {
    let half = time > 18 || time <= 6 ? 'n' : 'd' as Half;
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
  */
  async __get_location(): Promise<[number, number]> {
    if (settings.get_setting("Datetime", "location")) {
      // attempts to get the location via the geolocation api
      let pos: GeolocationPosition = await new Promise((resolve, reject) => {
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
    if (current == undefined) {
      // where are you? The middle of nowhere.
      return [0, 0];
    }

    let [latitude, longitude] = [current.lat, current.long];
    this.storage.setStorage("lvia", "timezone", MiliSeconds.day);
    return [latitude, longitude];
  }

  /**
  * Get the times for a given location
  * @returns A list of times in Date format.
  */
  async __get_times(force_update: boolean = false) {
    // checks if we can bypass the storage check or not.
    // The bypass is for when changing settings, hence we don't have to wait a whole day to get the new values.
    let bypass_storage = false;
    if (this.storage.hasStorage("lvia")) {
      let previous_access = this.storage.getStorage("lvia");
      let loc = settings.get_setting("Datetime", "location");
      bypass_storage = loc ? previous_access != "api" : previous_access != "timezone";
    }

    // If we can't bypass storage, and we have storage. prefer that instead.
    if (!force_update && !bypass_storage && this.storage.hasStorage("times")) {
      this.verbose.debug("We have storage, using that instead!");
      let data = JSON.parse(this.storage.getStorage("times") as string) as TimesCollection;
      data.sunrise.yesterday = new Date(data.sunrise.yesterday);
      data.sunrise.today = new Date(data.sunrise.today);
      data.sunrise.tomorrow = new Date(data.sunrise.tomorrow);
      data.sunset.yesterday = new Date(data.sunset.yesterday);
      data.sunset.today = new Date(data.sunset.today);
      data.sunset.tomorrow = new Date(data.sunset.tomorrow);
      return data;
    }

    let [latitude, longitude] = await this.__get_location();

    // Get the current time
    let yesterday = new Date();
    // let yesterday = modifyDay(now, -1);
    let now = modifyDay(yesterday, 1);
    let tomorrow = modifyDay(now, 1);
    // let yesterday = now.subtract(1, 'day');
    // let tomorrow = now.add(1, 'day');

    // @ts-ignore
    let yesterdaySunCalc = SunCalc.getTimes(yesterday, latitude, longitude);
    // @ts-ignore
    let todaySunCalc = SunCalc.getTimes(now, latitude, longitude);
    // @ts-ignore
    let tomorrowSunCalc = SunCalc.getTimes(tomorrow, latitude, longitude);

    /**
    * calculate a lot of times
    */
    let times: TimesCollection = {
      sunrise: {
        yesterday: new Date(yesterdaySunCalc.sunrise),
        today: new Date(todaySunCalc.sunrise),
        tomorrow: new Date(tomorrowSunCalc.sunrise)
      },
      sunset: {
        yesterday: new Date(yesterdaySunCalc.sunset),
        today: new Date(todaySunCalc.sunset),
        tomorrow: new Date(tomorrowSunCalc.sunset)
      }
    }

    this.storage.setStorage("times", JSON.stringify(times), MiliSeconds.midnight);
    return times;
  }

  /**
  * Get the progress of days
  * @param now The current time
  * @returns The duration of day (+) / night (-), and the progress.
  */
  get_progress(now: Date, times: TimesCollection) {
    if (isAfter(now, times.sunset.today)) {
      this.verbose.log(`Evening`);
      // After sunset but before midnight
      let nightDuration = timeDiffHour(times.sunrise.tomorrow, times.sunset.today);
      // let nightDuration = times.sunrise.tomorrow.diff(times.sunset.today, 'hours', true);
      return {
        duration: -nightDuration,
        progress: timeDiffHour(now, times.sunset.today) / nightDuration
      };
    }

    if (isBefore(now, times.sunrise.today)) {
      this.verbose.log(`Morning`);
      // After midnight but before sunrise
      let nightDuration = timeDiffHour(times.sunset.yesterday, times.sunrise.today);
      return {
        duration: nightDuration,
        progress: timeDiffHour(times.sunset.yesterday, now) / nightDuration
      };
    }

    this.verbose.log(`Day`);
    // It's daytime
    let dayDuration = timeDiffHour(times.sunset.today, times.sunrise.today);
    return {
      duration: dayDuration,
      progress: timeDiffHour(now, times.sunrise.today) / dayDuration
    };
  }

  /**
    * Calculates the time until the next quarter increment based on progress
    * @param progress - Current progress value (0-1)
    * @returns - Time in milliseconds until next quarter increment
    */
  calculate_time_to_next_quarter(progress: { duration: number; progress: number; }) {
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
    let now = new Date();
    let times = await this.__get_times();
    // this.verbose.log(now.format());
    this.verbose.log(times);

    // get the current progress in the day/night cycle. and for how long.
    let progress = this.get_progress(now, times);
    if (progress.progress >= 2 || progress.progress < 0) {
      this.verbose.log("Force update as negative or positive values!");
      times = await this.__get_times(true);
      this.verbose.log(times);
    }
    this.verbose.info(`Progress: ${progress.progress}`);
    this.verbose.info(`Duration: ${progress.duration} hours`);

    let half = (progress.duration > 0) ? `d` : `n` as Half;
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
    setting_default: (state: any) => {
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
     * @param _ - Unused parameter
     */
    setting_realistic: (_: SettingType = false) => {
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
    setting_enable: (_: any) => {
      clearTimeout(this.clock);
      this.settings.setting_realistic();
      this.settings.setting_default(settings.get_setting("Datetime", "default_state"));
    }
  }
}

const date_time = new DateTime();

export { date_time }
