const attribution = {
  jawg: '<a href="https://mapzen.com/tangram" target="_blank" rel="noopener">Tangram</a> | &copy; OpenStreetMap | <a href="https://www.jawg.io" target="_blank" rel="noopener">Jawg</a>'
};

const layers = {
  light: Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@jawg/streetcomplete-light-style.yaml',
    attribution: attribution.jawg
  }),
  dark: Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@jawg/streetcomplete-dark-style.yaml',
    attribution: attribution.jawg
  }),
  satellite: Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@jawg/streetcomplete-satellite-style.yaml',
    attribution: attribution.jawg
  })
};

const map = L.map('map', {
  center: [
    localStorage.getItem('lat') || 40.70531887544228,
    localStorage.getItem('lng') || -74.00976419448853
  ],
  zoom: localStorage.getItem('zoom') || 15,
  zoomControl: false
});

map.on('layeradd', event => {
  layer = event.layer;
  layer.scene.subscribe({
    load: () => {
      layer.scene.config.global.api_key = new TextDecoder().decode(new Uint8Array([54, 73, 99, 75, 106, 56, 99, 81, 107, 76, 84, 51, 97, 69, 48, 48, 55, 85, 115, 99, 86, 85, 85, 84, 103, 54, 115, 57, 48, 82, 69, 121, 78, 80, 110, 54, 72, 72, 76, 76, 78, 115, 111, 71, 83, 50, 57, 77, 90, 76, 121, 111, 54, 51, 112, 115, 111, 109, 110, 81, 106, 87, 67, 108]));
      layer.scene.updateConfig();
    }
  });
});

map.addLayer(layers.light);

Array.from(document.querySelectorAll('#layer-selection button')).forEach(element => {
  element.addEventListener('click', () => {
    document.querySelector('#layer-selection button.active').classList.remove('active');
    element.classList.add('active');

    map.eachLayer(layer => layer.remove());
    const layer = layers[element.dataset.layer];
    map.addLayer(layer);
  });
});

window.addEventListener('beforeunload', () => {
  window.localStorage.setItem('lat', map.getCenter().lat);
  window.localStorage.setItem('lng', map.getCenter().lng);
  window.localStorage.setItem('zoom', map.getZoom());
});
