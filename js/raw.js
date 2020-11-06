const { VectorTile, VectorTileFeature } = require('@mapbox/vector-tile');
const Protobuf = require('pbf');

const RawLayer = L.GridLayer.extend({
  initialize: function(options) {
    L.GridLayer.prototype.initialize.call(this, options);
    Object.assign(this.options, options);
    this.tiles = {};
  },

  load: function(coordinates) {
    const id = `${coordinates.x}/${coordinates.y}/${coordinates.z}`;
    if (typeof this.tiles[id] !== 'undefined') {
      return Promise.resolve(this.tiles[id]);
    } else {
      const url = L.Util.template(this.options.url, Object.assign(coordinates, {
        s: (s => s[Math.floor(Math.random() * s.length)])(['a', 'b', 'c']),
        key: this.options.key
      }));
      return fetch(url).then(response => {
        if (response.ok) return response.arrayBuffer();
        else throw new Error(`${response.status} ${response.statusText} (${response.url})`);
      }).then(buffer => {
        const tile = new VectorTile(new Protobuf(buffer));
        this.tiles[id] = tile;
        return tile;
      });
    }
  },

  createTile: function(coordinates) {
    const tileSize = this.getTileSize();

    const SVG = L.SVG.create('svg');
    const ROOT = L.SVG.create('g');
    SVG.setAttribute('viewBox', `0 0 ${tileSize.x} ${tileSize.y}`);
    SVG.appendChild(ROOT);

    this.load(coordinates).then(tile => {
        Object.entries(tile.layers).forEach(([name, layer]) => {
          const pxPerExtent = tileSize.divideBy(layer.extent);

          for (let i = 0; i < layer.length; i++) {
            const FEATURE = layer.feature(i);
            const TYPE = VectorTileFeature.types[FEATURE.type];
            let geometry = FEATURE.loadGeometry();
            // Apply the correct scale to the geometry
            geometry = geometry.map(ring => ring.map(point => L.point(point).scaleBy(pxPerExtent)));

            switch (TYPE) {
              case 'Point':
                const CIRCLE = L.SVG.create('circle');
                const point = geometry[0][0];
                CIRCLE.setAttribute('cx', point.x);
                CIRCLE.setAttribute('cy', point.y);
                CIRCLE.setAttribute('r', 1);
                this.setStyle(CIRCLE, TYPE);
                ROOT.appendChild(CIRCLE);
                break;
              case 'LineString':
              case 'Polygon':
                const PATH = L.SVG.create('path');
                PATH.setAttribute('d', L.SVG.pointsToPath(geometry, TYPE === 'Polygon'));
                this.setStyle(PATH, TYPE);
                ROOT.appendChild(PATH);
                break;
            }
          }
        });
    });
    return SVG;
  },

  setStyle: function(path, type) {
    let options  = {};
    switch (type) {
      case 'Point':
        options = L.Circle.prototype.options;
        break;
      case 'LineString':
        options = L.Path.prototype.options;
        break;
      case 'Polygon':
        options = L.Polygon.prototype.options;
        break;
    }
    options = Object.assign(options, {
      weight: 0.25
    });

    if (options.stroke) {
      path.setAttribute('stroke', options.color);
      path.setAttribute('stroke-opacity', options.opacity);
      path.setAttribute('stroke-width', options.weight);
      path.setAttribute('stroke-linecap', options.lineCap);
      path.setAttribute('stroke-linejoin', options.lineJoin);
    } else {
      path.setAttribute('stroke', 'none');
    }

    if (options.fill) {
      path.setAttribute('fill', options.fillColor || options.color);
      path.setAttribute('fill-opacity', options.fillOpacity);
      path.setAttribute('fill-rule', options.fillRule || 'evenodd');
    } else {
      path.setAttribute('fill', 'none');
    }
  }
});

module.exports = RawLayer;
