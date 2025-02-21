class DateTime {
  time = 0;

  constructor() {
    this.storage = new DragStorage('datetime');
  }

  set_time(modifier) {
    document.body.classList.remove(`g${this.time}`);
    this.time += modifier;
    document.body.classList.add(`g${this.time}`);

    const [website_mode, real_mode] = this.time >= 18 || this.time <= 6 ? ['light', 'dark'] : ['dark', 'light'];
    ui('mode', website_mode);
    document.getElementById("button-snacks").classList.remove(website_mode);
    document.getElementById("button-snacks").classList.add(real_mode);
  }

  set_to_now() {
    const now = new Date();
    this.set_time(now.getHours() - this.time);
  }

  __sync_to_hour() {
    const now = new Date();
    const minutes_ms_to_hour = 60 - now.getMinutes() * 60 * 1000;
    const seconds_ms_to_minute = 60 - now.getSeconds() * 1000;
    const milliseconds_to_second = 1000 - now.getMilliseconds();
    const time_to_hour = minutes_ms_to_hour + seconds_ms_to_minute + milliseconds_to_second;

    console.log(time_to_hour);
    setTimeout(() => {
      this.__clock();
    }, time_to_hour);
  }

  __clock() {
    this.set_to_now();
    setInterval(this.set_to_now, 3_600_000);
  }

  start_clock() {
    this.__sync_to_hour();
  }

  async __get_location() {
    const location = await fetch(`https://ipapi.co/json/`);
    const data = await location.json();
    return [data.latitude, data.longitude];
  }

  async get_sun() {
    const [latitude, longitude] = await this.__get_location();
    const sunrise = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=today&formatted=0`);
    const data = await sunrise.json();
    return data.results;
  }

  async sync_with_nature() {
    const sun_data = await this.get_sun();
    const sunrise = new Date(sun_data.sunrise);
    const sunset = new Date(sun_data.sunset);
    const now = new Date();

    const day_length = sunset - sunrise;
    const night_length = (24 * 60 * 60 * 1000) - day_length;
    const ms_since_sunrise = now - sunrise;
    const ms_since_sunset = now - sunset;

    let gradient_stage;
    if (now > sunrise && now < sunset) {
      // Day time - 36 stages
      gradient_stage = Math.floor((ms_since_sunrise / day_length) * 36);
    } else {
      // Night time - 24 stages
      if (now < sunrise) {
        gradient_stage = Math.floor(((ms_since_sunset + night_length) / night_length) * 24) + 36;
      } else {
        gradient_stage = Math.floor((ms_since_sunset / night_length) * 24) + 36;
      }
    }

    // Remove all existing gradient classes
    for (let i = 0; i <= 60; i++) {
      document.body.classList.remove(`gradient-${i}`);
    }

    // Add new gradient class
    document.body.classList.add(`gradient-${gradient_stage}`);

    // Update every minute
    setTimeout(() => this.sync_with_nature(), 60000);
  }
}

const date_time = new DateTime();
date_time.start_clock();
