function load_particles(seasonal = true) {
  // if (seasonal) {
  // }

  if (pJSDom.length > 0) return;
  particlesJS.load('particles-js', 'Scripts/Particles/seasons/winter.json');
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
