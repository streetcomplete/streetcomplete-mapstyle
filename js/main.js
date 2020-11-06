const MapView = require('./mapview.js');

const SETTINGS = {
  style: 'light',
  opacity: 1,
  compare: false,
  debug: false,
  raw: false
}

const MAPS = [
  new MapView('jawg', {
    container: document.getElementById('jawg'),
    editor: document.getElementById('jawg-container'),
    attribution: '&copy; <a href="https://www.jawg.io" target="_blank" rel="noopener">Jawg</a>',
    debug: SETTINGS.debug,
    raw: {
      url: 'https://tile.jawg.io/streets-v2/{z}/{x}/{y}.pbf?access-token={key}',
      maxZoom: 16
    },
    key: [54, 73, 99, 75, 106, 56, 99, 81, 107, 76, 84, 51, 97, 69, 48, 48, 55, 85, 115, 99, 86, 85, 85, 84, 103, 54, 115, 57, 48, 82, 69, 121, 78, 80, 110, 54, 72, 72, 76, 76, 78, 115, 111, 71, 83, 50, 57, 77, 90, 76, 121, 111, 54, 51, 112, 115, 111, 109, 110, 81, 106, 87, 67, 108]
  }),
  new MapView('nextzen', {
    container: document.getElementById('nextzen'),
    editor: document.getElementById('nextzen-container'),
    attribution: '&copy; <a href="https://www.nextzen.org/" target="_blank" rel="noopener">Nextzen</a>',
    debug: SETTINGS.debug,
    raw: {
      url: 'https://tile.nextzen.org/tilezen/vector/v1/512/all/{z}/{x}/{y}.mvt?api_key={key}',
      maxZoom: 16
    },
    key: [95, 78, 112, 73, 86, 116, 90, 45, 82, 116, 109, 77, 83, 98, 48, 84, 78, 121, 55, 117, 108, 103]
  }),
  new MapView('openmaptiles', {
    container: document.getElementById('openmaptiles'),
    editor: document.getElementById('openmaptiles-container'),
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a> | &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a>',
    debug: SETTINGS.debug,
    raw: {
      url: 'https://tiles.stadiamaps.com/data/openmaptiles/{z}/{x}/{y}.pbf?api_key={key}',
      maxZoom: 16
    }
  }),
  new MapView('thunderforest', {
    container: document.getElementById('thunderforest'),
    editor: document.getElementById('thunderforest-container'),
    attribution: '&copy; <a href="http://www.thunderforest.com/" target="_blank" rel="noopener">Thunderforest</a>',
    debug: SETTINGS.debug,
    raw: {
      url: 'https://{s}.tile.thunderforest.com/thunderforest.outdoors-v2/{z}/{x}/{y}.vector.pbf?apikey={key}',
      maxZoom: 14
    },
    key: [52, 48, 56, 57, 56, 49, 55, 97, 49, 54, 50, 51, 52, 100, 102, 98, 57, 50, 52, 101, 55, 102, 48, 98, 100, 100, 49, 102, 102, 50, 57, 99]
  })
];

// Loads styles into the editors
async function styles() {
  view();

  for (let i = 0; i < MAPS.length; i++) {
    const view = MAPS[i];
    const editor = view.editor;

    // Only load necessary styles and clear the content of the editor if the style is not in use
    if (!SETTINGS.compare && i >= 1) {
      editor.getDoc().setValue('');
      editor.getDoc().clearHistory();
      continue;
    }

    const provider = view.provider;
    const style = SETTINGS.style;
    const url = `https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@${provider}/streetcomplete-${style}-style.yaml`;
    const content = await fetch(url).then(response => response.text());
    editor.getDoc().setValue(content);
    editor.getDoc().clearHistory();
  }

  raw();
}

function raw() {
  for (let i = 0; i < (SETTINGS.compare ? MAPS.length : 1); i++) {
    const view = MAPS[i];
    if (SETTINGS.raw === true) {
      view.map.addLayer(view.layers.raw);
    } else {
      view.map.removeLayer(view.layers.raw);
    }
  }
}

// Update the map views to either show a single map or all at once
function view() {
  document.getElementById('maps').dataset.view = SETTINGS.compare ? 'multi' : 'single';
  MAPS.forEach(view => {
    view.map.invalidateSize();
  });
}

// Synchronize map movement
function sync() {
  for (let a of MAPS) {
    for (let b of MAPS) {
      if (a.provider == b.provider) continue;
      a.map.sync(b.map);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  sync();
  styles();
});

window.addEventListener('beforeunload', () => {
  const { map } = MAPS[0];
  window.localStorage.setItem('lat', map.getCenter().lat);
  window.localStorage.setItem('lng', map.getCenter().lng);
  window.localStorage.setItem('zoom', map.getZoom());
});

/*---------- GUI control interface ----------*/
const gui = new dat.GUI();
gui.domElement.parentNode.style.zIndex = 500;

gui.add(SETTINGS, 'style', {
  'Light': 'light',
  'Dark': 'dark',
  'Satellite': 'satellite'
}).onChange(style => styles());
gui.add(SETTINGS, 'opacity', 0, 1, 0.1).onChange(opacity => {
  for (let view of MAPS) {
    view.layers.tangram.setOpacity(opacity);
  }
});
gui.add(SETTINGS, 'compare').onChange(() => styles());
gui.add(SETTINGS, 'debug').onChange(value => {
  for (let view of MAPS) {
    view.debug(value);
  }
});
gui.add(SETTINGS, 'raw').onChange(() => raw());
