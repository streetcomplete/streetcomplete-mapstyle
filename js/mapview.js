import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml.js';
import { debounce } from 'lodash';

import RawLayer from './raw.js';

const CONFIG = {
  ATTRIBUTION: '<a href="https://geocode.earth" target="_blank" rel="noopener">Geocode.earth</a> | <a href="https://mapzen.com/tangram" target="_blank" rel="noopener">Tangram</a> | &copy; <a href="https://www.osm.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  MAP: {
    center: {
      lat: localStorage.getItem('lat') || 40.70531887544228,
      lng: localStorage.getItem('lng') || -74.00976419448853
    },
    zoom: localStorage.getItem('zoom') || 15,
    zoomControl: false
  },
  GEOCODING: {
    key: [54, 73, 99, 75, 106, 56, 99, 81, 107, 76, 84, 51, 97, 69, 48, 48, 55, 85, 115, 99, 86, 85, 85, 84, 103, 54, 115, 57, 48, 82, 69, 121, 78, 80, 110, 54, 72, 72, 76, 76, 78, 115, 111, 71, 83, 50, 57, 77, 90, 76, 121, 111, 54, 51, 112, 115, 111, 109, 110, 81, 106, 87, 67, 108]
  },
  EDITOR: {
    mode: 'yaml',
    theme: 'material',
    autofocus: true,
    lineNumbers: true,
    lineWrapping: true,
    smartIndent: false
  }
}

export default class MapView {
  constructor(provider, options) {
    this.provider = provider;
    this.options = options;

    this.map = L.map(options.container, CONFIG.MAP);
    this.editor = CodeMirror(options.editor, CONFIG.EDITOR);
    this.layers = {
      tangram: Tangram.leafletLayer({
        attribution: this.options.attribution ? `${CONFIG.ATTRIBUTION} | ${this.options.attribution}` : CONFIG.ATTRIBUTION,
        introspection: this.options.debug,
        scene: this.scene(),
        events: {
          hover: selection => this.hover(this.map, this.layers.tangram, selection)
        }
      }),
      raw: new RawLayer({
        url: this.options.raw.url,
        maxNativeZoom: this.options.raw.maxZoom,
        key: new TextDecoder().decode(new Uint8Array(this.options.key))
      })
    };
    this.setup();
  }

  setup() {
    // Directly add the Tangram layer to the map
    const tangram = this.layers.tangram;
    this.map.addLayer(tangram);
    tangram.bindTooltip(L.tooltip());
    this.map.on('zoom', () => tangram.closeTooltip());

    const reload = () => {
      tangram.scene.load(this.scene());
    };
    this.editor.on('change', debounce(reload, 1000));

    // Add map-related controls (for editing the map and geocoding)
    this.map.addControl(new L.Control.Edit(this, {
      position: 'topleft'
    }));

    this.map.addControl(new L.Control.Geocoder(null, {
      url: 'https://api.jawg.io/places/v1',
      autocomplete: false,
      attribution: null,
      params: {
        'access-token': new TextDecoder().decode(new Uint8Array(CONFIG.GEOCODING.key))
      },
    }));
  }

  scene() {
    const content = this.editor.getValue();
    if (!content) return {};
    return {
      import: [
        URL.createObjectURL(new Blob([ content ]))
      ],
      global: {
        api_key: new TextDecoder().decode(new Uint8Array(this.options.key)),
        language: window.navigator.language || window.navigator.userLanguage
      }
    }
  }

  hover(map, layer, selection) {
    const feature = selection.feature;
    if (!feature || !this.options.debug) return layer.closeTooltip();
    if (selection.changed) {
      layer.getTooltip().setContent(this.tooltip(feature));
    }
    layer.openTooltip(selection.leaflet_event.latlng);
  }

  tooltip(feature) {
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

  debug(value) {
    this.options.debug = value;
    this.layers.tangram.scene.setIntrospection(value);
  }
}

L.Control.Edit = L.Control.extend({
  initialize: function(view, options) {
    L.Control.prototype.initialize.call(this, options);
    this.view = view;
  },

  onAdd: function() {
    const provider = this.view.provider;
    const editor = this.view.editor;
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
