function load_particles(seasonal = true) {
  // if (seasonal) {
  // }

  particlesJS.load('particles-js', 'Scripts/Particles/seasons/winter.json');
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
