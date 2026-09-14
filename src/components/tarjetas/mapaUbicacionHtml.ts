export const getInteractiveMapHtml = (lat: number, lng: number): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; background: #1D2125; cursor: pointer; }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-layers {
      background: #2C333A !important;
      color: #FFF !important;
      border: 1px solid #384148 !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
    }
    .leaflet-control-layers label {
      margin-bottom: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .leaflet-control-layers-expanded {
      padding: 10px 14px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var currentLat = ${lat};
    var currentLng = ${lng};

    // 1. Google Híbrido (Satélite + Nombres de Calles y Sectores)
    var googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: 'Google Maps'
    });

    // 2. Google Satélite Solo
    var googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: 'Google Maps'
    });

    // 3. OpenStreetMap Callejero
    var osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap'
    });

    // Inicializar mapa con Satélite Híbrido por defecto a Zoom 17
    var map = L.map('map', {
      zoomControl: true,
      layers: [googleHybrid]
    }).setView([currentLat, currentLng], 17);

    // Control Selector de Capas sin emojis
    var baseMaps = {
      "Satélite con Calles": googleHybrid,
      "Satélite Solo": googleSatellite,
      "Mapa Callejero": osmStandard
    };

    L.control.layers(baseMaps, null, { position: 'topright', collapsed: false }).addTo(map);

    var marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);

    function notifyCoords(latVal, lngVal) {
      var data = JSON.stringify({ latitude: latVal, longitude: lngVal });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(data);
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, '*');
      }
    }

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyCoords(e.latlng.lat, e.latlng.lng);
    });

    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      notifyCoords(pos.lat, pos.lng);
    });
  </script>
</body>
</html>
`;
