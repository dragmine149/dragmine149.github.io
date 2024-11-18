var time_index = 0;

// "debug" functions. Just changing the time as a way to test the css without having to wait until x hour.
function increment_time() {
  const old_time = time_index;
  time_index = (time_index + 1) % 24;
  set_to_time(old_time);
}
function decrement_time() {
  const old_time = time_index;
  time_index = time_index - 1 < 0 ? 23 : time_index - 1;
  set_to_time(old_time);
}
/**
* @param {Number} old_time
*/
function set_to_time(old_time) {
  document.body.classList.remove(`g${old_time}`);
  document.body.classList.add(`g${time_index}`);
}

// a timer that runs every hour, on the hour, to update the css.
class internal_clock {
  callback = set_to_now;

  start_clock() {
    const now = new Date();
    const time_to_hour = (60 - now.getMinutes()) * 60 * 1000 + (60 - now.getSeconds()) * 1000 + (1000 - now.getMilliseconds()) + 1000;
    // const time_to_hour = 10_000;
    console.log(time_to_hour);
    // Sync the clock to the hour
    //   setTimeout(() => {
    //     this.start_timer();
    //   }, time_to_hour);
    setTimeout(this.start_timer, time_to_hour);
  }

  start_timer() {
    this.callback();
    // setInterval(this.callback, 10_000);
    setInterval(this.callback, 3_601_000);
  }
}

/**
* Sets the body to the current user time.
*/
function set_to_now() {
  const old_time = time_index;
  const now = new Date();
  time_index = now.getHours();
  console.log({ time_index });
  set_to_time(old_time);
}

set_to_now();
const clock = new internal_clock();
clock.start_clock();
