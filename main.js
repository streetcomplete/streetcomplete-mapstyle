const attribution = {
  mapzen: '<a href="https://mapzen.com/tangram" target="_blank" rel="noopener">Tangram</a> | &copy; OpenStreetMap | <a href="https://map-data.de/" target="_blank" rel="noopener">Map-Data</a>'
};

const layers = {
  light: Tangram.leafletLayer({
      scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@master/streetcomplete-light-style.yaml',
      attribution: attribution.mapzen
  }),
  dark: Tangram.leafletLayer({
      scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@master/streetcomplete-dark-style.yaml',
      attribution: attribution.mapzen
  }),
  satellite: Tangram.leafletLayer({
      scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@master/streetcomplete-satellite-style.yaml',
      attribution: attribution.mapzen
  })
};
let active = layers.light;

const map = L.map('map', {
    layers: [ active ],
    center: [
      localStorage.getItem('lat') || 40.70531887544228,
      localStorage.getItem('lng') || -74.00976419448853
    ],
    zoom: localStorage.getItem('zoom') || 15,
    zoomControl: false
});

Array.from(document.querySelectorAll('#layer-selection button')).forEach(element => {
  element.addEventListener('click', () => {
    document.querySelector('#layer-selection button.active').classList.remove('active');
    element.classList.add('active');

    const layer = layers[element.dataset.layer];
    map.removeLayer(active);
    map.addLayer(layer);
    active = layer;
  });
});

window.addEventListener('beforeunload', () => {
  window.localStorage.setItem('lat', map.getCenter().lat);
  window.localStorage.setItem('lng', map.getCenter().lng);
  window.localStorage.setItem('zoom', map.getZoom());
});
