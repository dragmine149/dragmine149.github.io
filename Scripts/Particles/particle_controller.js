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
  },
  // "Summer": {
  //   "config": "Scripts/Particles/seasons/summer.json",
  //   "start_date": dayjs().set('date', 20).set('month', 4),
  //   "end_date": dayjs().set('date', 25).set('month', 7)
  // }
  "Summer": {
    "start_date": dayjs().set('date', 20).set('month', 4),
    "end_date": dayjs().set('date', 25).set('month', 7)
  }
};

function load_particles(seasonal = true) {
  let dm = dayjs();
  let config = Object.values(seasonal_settings).filter((v) => v.start_date.isBefore(dm) && v.end_date.isAfter(dm)).at(0).config;

  if (pJSDom.length > 0) return;
  particlesJS.load('particles-js', config);
}

function disable_particles() {
  if (pJSDom.length > 0) {
    pJSDom[0].pJS.fn.vendors.destroypJS();
    pJSDom = [];
  }
}

settings.add_listener("Particle", "enabled", (v) => {
  v ? load_particles() : disable_particles();
});
