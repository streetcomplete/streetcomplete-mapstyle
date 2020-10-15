const CodeMirror = require('codemirror');
require('codemirror/mode/yaml/yaml');
const dat = require('dat.gui');
const { debounce } = require('lodash');
const YAML = require('yaml');

const ATTRIBUTION = {
  ALL: '<a href="https://mapzen.com/tangram" target="_blank" rel="noopener">Tangram</a> | &copy; <a href="https://www.osm.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  jawg: '&copy; <a href="https://www.jawg.io" target="_blank" rel="noopener">Jawg</a>',
  nextzen: '&copy; <a href="https://www.nextzen.org/" target="_blank" rel="noopener">Nextzen</a>',
  openmaptiles: '&copy; <a href="https://www.stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a> | &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a>',
  thunderforest: '&copy; <a href="http://www.thunderforest.com/" target="_blank" rel="noopener">Thunderforest</a>'
};

const OPTIONS = {
  MAPS: {
    center: {
      lat: localStorage.getItem('lat') || 40.70531887544228,
      lng: localStorage.getItem('lng') || -74.00976419448853
    },
    zoom: localStorage.getItem('zoom') || 15,
    zoomControl: false
  },
  EDITOR: {
    mode: 'yaml',
    theme: 'material',
    autofocus: true,
    lineNumbers: true,
    lineWrapping: true,
    smartIndent: false
  },
  jawg: {
    key: [54, 73, 99, 75, 106, 56, 99, 81, 107, 76, 84, 51, 97, 69, 48, 48, 55, 85, 115, 99, 86, 85, 85, 84, 103, 54, 115, 57, 48, 82, 69, 121, 78, 80, 110, 54, 72, 72, 76, 76, 78, 115, 111, 71, 83, 50, 57, 77, 90, 76, 121, 111, 54, 51, 112, 115, 111, 109, 110, 81, 106, 87, 67, 108]
  },
  nextzen: {
    key: [95, 78, 112, 73, 86, 116, 90, 45, 82, 116, 109, 77, 83, 98, 48, 84, 78, 121, 55, 117, 108, 103]
  },
  thunderforest: {
    key: [52, 48, 56, 57, 56, 49, 55, 97, 49, 54, 50, 51, 52, 100, 102, 98, 57, 50, 52, 101, 55, 102, 48, 98, 100, 100, 49, 102, 102, 50, 57, 99]
  }
};

const SETTINGS = {
  style: 'light',
  compare: false,
  debug: false
}

const MAPS = {
  jawg: L.map('jawg', Object.assign(OPTIONS.MAPS, OPTIONS.jawg)),
  nextzen: L.map('nextzen', Object.assign(OPTIONS.MAPS, OPTIONS.nextzen)),
  openmaptiles: L.map('openmaptiles', Object.assign(OPTIONS.MAPS, OPTIONS.openmaptiles)),
  thunderforest: L.map('thunderforest', Object.assign(OPTIONS.MAPS, OPTIONS.thunderforest))
};

const EDITORS = {
  jawg: CodeMirror(document.getElementById('jawg-container'), OPTIONS.EDITOR),
  nextzen: CodeMirror(document.getElementById('nextzen-container'), OPTIONS.EDITOR),
  openmaptiles: CodeMirror(document.getElementById('openmaptiles-container'), OPTIONS.EDITOR),
  thunderforest: CodeMirror(document.getElementById('thunderforest-container'), OPTIONS.EDITOR)
};

L.Control.Edit = L.Control.extend({
  onAdd: map => {
    const provider = map.getContainer().id;
    const editor = EDITORS[provider];
    const container = editor.getWrapperElement();

    const edit = L.DomUtil.create('div', 'icon-button edit-icon');
    edit.addEventListener('click', () => {
      container.style.display = 'block';
      editor.refresh();
    });

    const close = document.createElement('div');
    close.classList.add('icon-button', 'close-icon');
    close.addEventListener('click', () => {
      container.style.display = 'none'
    });
    container.appendChild(close);

    return edit;
  }
});

/*---------- Maps ----------*/
// Loads styles into the editors
async function styles() {
  const entries = Object.entries(MAPS);
  for (let i = 0; i < entries.length; i++) {
    const [provider, map] = entries[i];
    const editor = EDITORS[provider];

    // Only load necessary styles and clear the content of the editor if the style is not in use
    if (!SETTINGS.compare && i >= 1) {
      editor.getDoc().setValue('');
      editor.getDoc().clearHistory();
      continue;
    }

    const style = SETTINGS.style;
    const url = `https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@${provider}/streetcomplete-${style}-style.yaml`;
    const content = await fetch(url).then(response => response.text());
    editor.getDoc().setValue(content);
    editor.getDoc().clearHistory();
  }
}

// Initialize map related actions
function maps() {
  for (let [provider, map] of Object.entries(MAPS)) {
    const editor = EDITORS[provider];
    editor.on('change', debounce((instance, changes) => {
      map.eachLayer(layer => {
        if (!layer.tangram) return;
        const content = editor.getValue();
        layer.scene.load(scene(content, map.options.key));
      });
    }, 1000));
  }

  // Synchronize map movement
  for (let [a, map] of Object.entries(MAPS)) {
    for (let [b, other] of Object.entries(MAPS)) {
      if (a == b) continue;
      map.sync(other);
    }
  }

  // Add a control button for editing the map
  Object.values(MAPS).forEach(map => {
    map.addControl(new L.Control.Edit({ position: 'topleft' }));
  });
}

// Adds the Tangram layers to the Leaflet maps
function layers() {
  view();

  Object.entries(MAPS).forEach(([provider, map], i) => {
    const layer = Tangram.leafletLayer({
      attribution: ATTRIBUTION[provider] ? `${ATTRIBUTION.ALL} | ${ATTRIBUTION[provider]}` : ATTRIBUTION.ALL,
      introspection: SETTINGS.debug,
      scene: scene(EDITORS[provider].getValue(), map.options.key),
      events: {
        hover: selection => hover(map, layer, selection)
      }
    });
    layer.tangram = true;
    map.addLayer(layer);

    layer.bindTooltip(L.tooltip());
    map.on('zoom', () => layer.closeTooltip());
  });
}

// Update the map views to either show a single map or all at once
function view() {
  document.getElementById('maps').dataset.view = SETTINGS.compare ? 'multi' : 'single';
  Object.values(MAPS).forEach(map => {
    map.invalidateSize();
  });
}

function scene(content, key) {
  if (!content) return {};
  return {
    import: [
      URL.createObjectURL(new Blob([ content ]))
    ],
    global: {
      api_key: new TextDecoder().decode(new Uint8Array(key)),
      language: window.navigator.language || window.navigator.userLanguage
    }
  }
}

function hover(map, layer, selection) {
  const feature = selection.feature;
  if (!feature || !SETTINGS.debug) return layer.closeTooltip();
  if (selection.changed) {
    layer.getTooltip().setContent(debug(feature));
  }
  layer.openTooltip(selection.leaflet_event.latlng);
}

function debug(feature) {
  const preferred = ['name', 'kind', 'kind_detail', 'id'];
  const properties = [...new Set([...preferred, ...Object.keys(feature.properties)])];
  const content = properties.map(property => {
    if (!feature.properties[property]) return;
    return `<div class="debug-row"><b>${property}</b> <span>${feature.properties[property]}</span></div>`;
  });

  return `<div class="debug">
            ${content.join('')}
            <hr>
            <div class="debug-row"><b>tile</b> <span>${feature.tile.coords.key}</span></div>
            <div class="debug-row"><b>source name</b> <span>${feature.source_name}</span></div>
            <div class="debug-row"><b>source layer</b> <span>${feature.source_layer}</span></div>
            <div class="debug-row"><b>scene layers</b> <span>${feature.layers.join('<br>')}</span></div>
          </div>`
}

window.addEventListener('beforeunload', () => {
  const map = Object.values(MAPS)[0];
  window.localStorage.setItem('lat', map.getCenter().lat);
  window.localStorage.setItem('lng', map.getCenter().lng);
  window.localStorage.setItem('zoom', map.getZoom());
});

styles().then(() => maps()).then(() => layers());

/*---------- GUI control interface ----------*/
const gui = new dat.GUI();
gui.domElement.parentNode.style.zIndex = 500;

gui.add(SETTINGS, 'style', {
  'Light': 'light',
  'Dark': 'dark',
  'Satellite': 'satellite'
}).onChange(style => styles());
gui.add(SETTINGS, 'compare').onChange(() => styles().then(() => view()));
gui.add(SETTINGS, 'debug').onChange(value => {
  Object.values(MAPS).forEach(map => {
    map.eachLayer(layer => {
      if (!layer.tangram) return;
      layer.scene.setIntrospection(value);
    });
  });
});
