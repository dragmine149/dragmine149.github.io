const seasonal_settings = {
  "Winter": {
    "config": "Scripts/Particles/seasons/winter.json",
    "start_date": dayjs().set('date', 25).set('month', 10).set('year', dayjs().year() - 1),
    "end_date": dayjs().set('date', 1).set('month', 2)
  },
  "Spring": {
    "config": "Scripts/Particles/seasons/spring.json",
    "start_date": dayjs().set('date', 1).set('month', 2),
    "end_date": dayjs().set('date', 20).set('month', 4)
  }
};

function load_particles(seasonal = true) {
  let dm = dayjs();
  let config = Object.values(seasonal_settings).filter((v) => v.start_date.isBefore(dm) && v.end_date.isAfter(dm)).at(0).config;

  particlesJS.load('particles-js', config);
}

function disable_particles() {
  document.getElementById('particles-js').childNodes.forEach((child) => child.remove());
}

load_particles();

/** @param {HTMLInputElement} obj */
function snow_toggle(obj) {
  switch (obj.checked) {
    case true:
      load_particles();
    case false:
      disable_particles();
    default:
      console.error("Somehow a checkbox is not checked or not unchecked?");
  }
}
