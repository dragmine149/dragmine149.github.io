function load_particles(seasonal = true) {
  // if (seasonal) {
  // }

  particlesJS.load('particles-js', 'Scripts/Particles/seasons/winter.json');
}

function disable_particles() {
  document.getElementById('particles-js').childNodes.forEach((child) => child.remove());
}

// load_particles();

/** @param {HTMLInputElement} obj */
function snow_toggle(obj) {
  switch (obj.checked) {
    case true:
      load_particles();
      // settings.setStorage("particles", "1");
      break;
    case false:
      disable_particles();
      // settings.setStorage("particles", "0");
      break;
    default:
      console.error("Somehow a checkbox is not checked or not unchecked?");
      break;
  }
}

const snow_settings_elm = document.getElementById("Settings-snow");
snow_settings_elm.checked = settings.get_setting("Particle", "Enabled") ?? true;
snow_toggle(snow_settings_elm);
