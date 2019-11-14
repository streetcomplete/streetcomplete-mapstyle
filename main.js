const attribution = {
  mapzen: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>',
  mapbox: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapbox.com/" target="_blank">Mapbox</a>',
  terrestris: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://www.terrestris.de/" target="_blank">Terrestris</a>'
};

const mapzenLight = Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@master/streetcomplete-light-style.yaml',
    attribution: attribution.mapzen
});
const mapzenDark = Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@master/streetcomplete-dark-style.yaml',
    attribution: attribution.mapzen
});

const mapboxLight = Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@mapbox/streetcomplete-light-style.yaml',
    attribution: attribution.mapbox
});
const mapboxDark = Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@mapbox/streetcomplete-dark-style.yaml',
    attribution: attribution.mapbox
});
const mapboxSatellite = Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@master/streetcomplete-satellite-style.yaml',
    attribution: attribution.mapbox
});

const terrestrisLight = Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@terrestris/streetcomplete-light-style.yaml',
    attribution: attribution.terrestris
});
const terrestrisDark = Tangram.leafletLayer({
    scene: 'https://cdn.jsdelivr.net/gh/ENT8R/streetcomplete-mapstyle@terrestris/streetcomplete-dark-style.yaml',
    attribution: attribution.terrestris
});

const map = L.map('map', {
    layers: [mapzenLight]
});
L.control.layers({
    'Light Style (Mapzen)': mapzenLight,
    'Light Style (Mapbox)': mapboxLight,
    'Light Style (Terrestris)': terrestrisLight,
    'Dark Style (Mapzen)': mapzenDark,
    'Dark Style (Mapbox)': mapboxDark,
    'Dark Style (Terrestris)': terrestrisDark,
    'Satellite Style (Mapbox)': mapboxSatellite
}).addTo(map);

map.setView([40.70531887544228, -74.00976419448853], 15);

if (typeof(Storage) !== 'undefined') {
    const lat = localStorage.getItem('lat');
    const lng = localStorage.getItem('lng');
    const zoom = localStorage.getItem('zoom');

    if (lat !== null && lng !== null && zoom !== null) {
      map.setView([lat, lng], zoom);
    }
}

window.onbeforeunload = function() {
    if (typeof(Storage) !== 'undefined') {
        localStorage.setItem('lat', map.getCenter().lat);
        localStorage.setItem('lng', map.getCenter().lng);
        localStorage.setItem('zoom', map.getZoom());
    }
};
