function load_particles(seasonal = true) {
  // if (seasonal) {
  // }

  particlesJS.load('particles-js', 'Scripts/Particles/seasons/winter.json');
}

function disable_particles() {
  pJSDom[0].pJS.fn.vendors.destroypJS();
}

settings.add_listener("Particle", "enabled", (v) => {
  v ? load_particles() : disable_particles();
});
