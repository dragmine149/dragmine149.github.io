function load_particles(seasonal = true) {
  // if (seasonal) {
  // }

  particlesJS.load('particles-js', 'Particles/seasons/winter.json');
}

function disable_particles() {
  document.getElementById('particles-js').childNodes.forEach((child) => child.remove());
}

load_particles();
