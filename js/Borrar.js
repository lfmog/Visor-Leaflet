// Initialize the map centered on Colombia
const map = L.map('map').setView([4.5709, -74.2973], 6);

// Add base map - Using OpenStreetMap as base
// Define base maps
const baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    "ESRI Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
    })
};

// Add default base map
baseMaps["OpenStreetMap"].addTo(map);


// Custom style for first polyline layer (vías principales)
// Add this near your other style definitions

// Custom icon for point layer (postes)
const pointIcon = L.divIcon({
    className: 'custom-fa-marker',  // Note the changed class name
    html: '<i class="fa-regular fa-flag"></i>',
    iconSize: [20, 20],            // Slightly larger for better visibility
    iconAnchor: [10, 10]           // Center anchor
});

const polyline1Style = {
    color: '#DE1414',
    weight: 4,
    opacity: 0.8
};

// Custom style for second polyline layer (C2)
const polyline2Style = {
    color: '#5CEE0E',
    weight: 4,
    opacity: 0.8,
};

const polyline3Style = {
    color: '#EE0ECC',
    weight: 4,
    opacity: 0.8,
};

const polyline4Style = {
    color: '#0E30EE',
    weight: 4,
    opacity: 0.8,
};

// Custom style for polygon layer
const polygonStyle = {
    fillColor: '#EDED0E',
    weight: 1,
    opacity: 1,
    color: '#EDED0E',
    fillOpacity: 0.4
};

// Create layer groups

const pointLayer = L.layerGroup().addTo(map);
const polyline1Layer = L.layerGroup().addTo(map);
const polyline2Layer = L.layerGroup().addTo(map);
const polyline3Layer = L.layerGroup().addTo(map);
const polyline4Layer = L.layerGroup().addTo(map);
const polygonLayer = L.layerGroup().addTo(map);
const pointLabelsLayer = L.layerGroup()
const polylineLabelsLayer = L.layerGroup()
const polygonLabelsLayer = L.layerGroup()

// -------------------------------------------------------------------------------
// Remove the static pointIcon constant and replace with a dynamic function
function getPointIcon(zoomLevel) {
    // Calculate size based on zoom level
    const baseSize = 14; // Base size at zoom level 12
    const size = Math.max(8, baseSize - (15 - zoomLevel)); // Adjust these values as needed
    
    return L.divIcon({
        className: 'custom-fa-marker',
        html: `<i class="fa-regular fa-flag" style="font-size: ${size}px;"></i>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
    });
}

// Store current point layers to update them on zoom
const pointLayers = [];

// Base map toggle control
document.getElementById('base-street').addEventListener('change', function() {
    if (this.checked) {
        map.removeLayer(baseMaps["ESRI Satellite"]);
        map.addLayer(baseMaps["OpenStreetMap"]);
    }
});

document.getElementById('base-satellite').addEventListener('change', function() {
    if (this.checked) {
        map.removeLayer(baseMaps["OpenStreetMap"]);
        map.addLayer(baseMaps["ESRI Satellite"]);
    }
});

function loadGeoJSON(url, layer, style, labelField, layerType = 'polygon') {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Clear previous data
            layer.clearLayers();
            
            // Add new data with style
            const geoJsonLayer = L.geoJSON(data, {
                pointToLayer: function(feature, latlng) {
                    if (layerType === 'point') {
                        return L.marker(latlng, { icon: pointIcon });
                    }
                    return L.circleMarker(latlng, style);
                },
                style: style,
                onEachFeature: function(feature, layer) {
                    // Add popup with feature information
                    if (feature.properties) {
                        let popupContent = '<div class="info"><h4>Información</h4>';
                        for (const prop in feature.properties) {
                            popupContent += `<b>${prop}:</b> ${feature.properties[prop]}<br>`;
                        }
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                    
                    // Add label if labelField is provided
                    if (labelField && feature.properties && feature.properties[labelField]) {
                        const label = L.marker(layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng(), {
                            icon: L.divIcon({
                                className: 'map-label',
                                html: `<div style="font-size: 12px; font-weight: bold; color: ${
                                    layerType === 'polygon' ? '#3388ff' : 
                                    layerType === 'polyline' ? '#ff0000' : 
                                    '#ff0000'}; 
                                    text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;">${feature.properties[labelField]}</div>`,
                                iconSize: [100, 20]
                            }),
                            interactive: false
                        });
                        
                        // Determine which label layer to use based on feature type
                        let targetLabelLayer;
                        if (layerType === 'polygon') {
                            targetLabelLayer = polygonLabelsLayer;
                        } else if (layerType === 'polyline') {
                            targetLabelLayer = polylineLabelsLayer;
                        } else {
                            targetLabelLayer = pointLabelsLayer;
                        }
                        
                        // Store the label in the appropriate layer but don't add to map yet
                        targetLabelLayer.addLayer(label);
                        
                        // Check if the corresponding toggle is checked
                        const toggleId = layerType === 'polygon' ? 'polygon-labels-toggle' :
                                       layerType === 'polyline' ? 'polyline-labels-toggle' :
                                       'point-labels-toggle';
                        
                        // Add to map only if toggle is checked
                        if (document.getElementById(toggleId)?.checked) {
                            map.addLayer(targetLabelLayer);
                        }
                    }
                }
            });
            
            layer.addLayer(geoJsonLayer);
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
        });
}
// Add zoom event listener to update icons
map.on('zoomend', function() {
    const currentZoom = map.getZoom();
    pointLayers.forEach(marker => {
        marker.setIcon(getPointIcon(currentZoom));
    });
});
// --------------------------------------------------------------------------------------------------------------------

// Load sample data (replace with your actual GeoJSON files)

// Point layer (e.g., postes)
loadGeoJSON('geojs/Puntos.geojson', 
           pointLayer, {color: '#ff0000'}, 'PK', 'point');

// First polyline layer (e.g., main roads)
loadGeoJSON('geojs/Linea_C1.geojson', 
           polyline1Layer, polyline1Style, 'TRAMO', 'polyline');

loadGeoJSON('geojs/Linea_C2.geojson', 
           polyline2Layer, polyline2Style, 'TRM_RML', 'polyline');

// Third polyline layer (e.g., rivers)
loadGeoJSON('geojs/Linea C3.geojson', 
           polyline3Layer, polyline3Style, 'TRM_RML', 'polyline');

// Fourth layer (e.g., rivers)
loadGeoJSON('geojs/Linea_Turno4_Adicional.geojson', 
           polyline4Layer, polyline4Style, 'TRM_RML', 'polyline');

// Polygon layer (e.g., departments of Colombia)
loadGeoJSON('geojs/Poligon.geojson', 
           polygonLayer, polygonStyle, 'NOMBRE_VER', 'polygon');


// Layer control toggles

document.getElementById('point-layer-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(pointLayer);
    } else {
        map.removeLayer(pointLayer);
    }
});

document.getElementById('polyline1-layer-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polyline1Layer);
    } else {
        map.removeLayer(polyline1Layer);
    }
});

document.getElementById('polyline2-layer-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polyline2Layer);
    } else {
        map.removeLayer(polyline2Layer);
    }
});

document.getElementById('polyline3-layer-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polyline3Layer);
    } else {
        map.removeLayer(polyline3Layer);
    }
});

document.getElementById('polyline4-layer-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polyline4Layer);
    } else {
        map.removeLayer(polyline4Layer);
    }
});

document.getElementById('polygon-layer-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polygonLayer);
    } else {
        map.removeLayer(polygonLayer);
    }
});

// Label control toggles

// Add point labels toggle (add this to your HTML first)
document.getElementById('point-labels-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(pointLabelsLayer);
    } else {
        map.removeLayer(pointLabelsLayer);
    }
});

document.getElementById('polyline-labels-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polylineLabelsLayer);
    } else {
        map.removeLayer(polylineLabelsLayer);
    }
});

document.getElementById('polygon-labels-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polygonLabelsLayer);
    } else {
        map.removeLayer(polygonLabelsLayer);
    }
});


// Add scale control
L.control.scale({position: 'bottomleft'}).addTo(map);

// Add legend
const legend = L.control({position: 'bottomright'});

legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
        <h4>Leyenda</h4>
        <div><i class="fa-solid fa-square" style="color: #74C0FC;"></i> Veredas </div>
        <div><i class="legend-icon polyline1-legend"></i> Linea C1</div>
        <div><i class="legend-icon polyline2-legend"></i> Linea C2</div>
        <div><i class="legend-icon polyline3-legend"></i> Linea C3</div>
        <div><i class="legend-icon polyline4-legend"></i> Linea C4</div>
        <div><i class="fa-solid fa-arrow-trend-down" style="color: #f70202;"></i> Ríosss</div>
        <div><i class="fa-regular fa-flag"></i> Postes</div>
        
    `;
    return div;
};

legend.addTo(map);