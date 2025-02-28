function load_particles(seasonal = true) {
  // if (seasonal) {
  // }

  particlesJS.load('particles-js', 'Scripts/Particles/seasons/winter.json');
}

function disable_particles() {
  document.getElementById('particles-js').childNodes.forEach((child) => child.remove());
}

settings.add_listener("Particle", "enabled", (v) => {
  v ? load_particles() : disable_particles();
});
