$(function() {
  var translateToMapCoords = function(coords) {
    return ol.proj.transform(coords, 'EPSG:4326', 'EPSG:3857')
  }

  var toPoint = function(loc) {
    var coords = translateToMapCoords([loc.coords[1], loc.coords[0]]);
    return new ol.geom.Point(coords);
  };

  var styleCache = {};
  var countriesLayer = new ol.layer.Vector({
    source: new ol.source.GeoJSON({
      projection: 'EPSG:3857',
      url: 'geodata/countries.geojson'
    }),
    style: function(feature, resolution) {
      var text = resolution < 5000 ? feature.get('name') : '';
      if (!styleCache[text]) {
        styleCache[text] = [new ol.style.Style({
          fill: new ol.style.Fill({ color: '#57B26E' }),
          stroke: new ol.style.Stroke({ color: '#7EC486', width: 1 })
        })];
      }
      return styleCache[text];
    }
  });

  var eventIconStyle = new ol.style.Style({
    image: new ol.style.Icon({
      scale: 0.05,
      anchor: [0.5, 1],
      src: 'images/map-pin.png'
    })
  });

  var events = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: eventIconStyle
  });


  $.get('data/locations.json', function(locations) {
    $.each(locations, function() {
      events.getSource().addFeature(
        new ol.Feature({
          geometry: toPoint(this),
          name: this.city
        })
      );
    })
  })

  var popupElem = document.getElementById('popup');

  var popup = new ol.Overlay({
    element: popupElem,
    positioning: 'top-center',
    stopEvent: false
  });

  var map = new ol.Map({
    interactions: ol.interaction.defaults({
      mouseWheelZoom: false
    }),
    controls: ol.control.defaults({
      attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
        collapsible: false
      })
    }),
    layers: [countriesLayer, events],
    overlays: [popup],
    target: document.getElementById('map'),
    view: new ol.View({
      center: translateToMapCoords([0, 40]),
      zoom: 1.2,
      minZoom: 1.2,
      maxZoom: 7,
      extent: [-17400000,-6040000,19400000,16200000]
    })
  });

  // display popup on click
  map.on('click', function(evt) {
    $(popupElem).popover('destroy');
    var feature = map.forEachFeatureAtPixel(evt.pixel,
        function(feature, layer) {
          if (layer == events)
             return feature;
        });
    if (feature) {
      var geometry = feature.getGeometry();
      var coord = geometry.getCoordinates();
      popup.setPosition(coord);
      $(popupElem).popover({
        'animation': false,
        'placement': 'top',
        'html': true,
        'content': feature.get('name')
      });
      // workaround for already displayed popovers
      $( "div.popover-content" ).text(feature.get('name'))

      $(popupElem).popover('show');
    }
  });

  // change mouse cursor when over marker
  $(map.getViewport()).on('mousemove', function(e) {
    var pixel = map.getEventPixel(e.originalEvent);
    var hit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
      return layer == events;
    });
    if (hit) {
      map.getTarget().style.cursor = 'pointer';
    } else {
      map.getTarget().style.cursor = '';
    }
  });
});
