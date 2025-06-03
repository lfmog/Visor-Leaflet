// Initialize the map centered on Colombia
const map = L.map('map').setView([4.5709, -74.2973], 6);

// Add base map - Using OpenStreetMap as base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Custom style for polygon layer
const polygonStyle = {
    fillColor: '#3388ff',
    weight: 1,
    opacity: 1,
    color: '#3388ff',
    fillOpacity: 0.4
};

// Custom style for first polyline layer (vías principales)
const polyline1Style = {
    color: '#ff0000',
    weight: 3,
    opacity: 0.8
};

// Custom style for second polyline layer (ríos)
const polyline2Style = {
    color: '#00aa00',
    weight: 2,
    opacity: 0.8,
    dashArray: '5, 5'
};

// // Custom icon for point layer (postes)
// const pointIcon = L.icon({
//     iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-orange.png',
//     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
//     iconSize: [25, 41],
//     iconAnchor: [12, 41],
//     popupAnchor: [1, -34],
//     shadowSize: [41, 41]
// });
const pointIcon = L.divIcon({
    className: 'custom-fa-marker',  // Note the changed class name
    html: '<i class="fa-regular fa-flag"></i>',
    iconSize: [20, 20],            // Slightly larger for better visibility
    iconAnchor: [10, 10]           // Center anchor
});

// Create layer groups
const polygonLayer = L.layerGroup().addTo(map);
const polyline1Layer = L.layerGroup().addTo(map);
const polyline2Layer = L.layerGroup().addTo(map);
const pointLayer = L.layerGroup().addTo(map);
// const polygonLabelsLayer = L.layerGroup().addTo(map);
// const polylineLabelsLayer = L.layerGroup().addTo(map);
// const pointLabelsLayer = L.layerGroup().addTo(map);
const polygonLabelsLayer = L.layerGroup()
const polylineLabelsLayer = L.layerGroup()
const pointLabelsLayer = L.layerGroup()


// Function to load GeoJSON data
// function loadGeoJSON(url, layer, style, labelField, layerType = 'polygon') {
//     fetch(url)
//         .then(response => response.json())
//         .then(data => {
//             // Clear previous data
//             layer.clearLayers();
            
//             // Add new data with style
//             const geoJsonLayer = L.geoJSON(data, {
//                 pointToLayer: function(feature, latlng) {
//                     if (layerType === 'point') {
//                         return L.marker(latlng, { icon: pointIcon });
//                     }
//                     return L.circleMarker(latlng, style);
//                 },
//                 style: style,
//                 onEachFeature: function(feature, layer) {
//                     // Add popup with feature information
//                     if (feature.properties) {
//                         let popupContent = '<div class="info"><h4>Información</h4>';
//                         for (const prop in feature.properties) {
//                             popupContent += `<b>${prop}:</b> ${feature.properties[prop]}<br>`;
//                         }
//                         popupContent += '</div>';
//                         layer.bindPopup(popupContent);
//                     }
                    
//                     // Add label if labelField is provided
//                     if (labelField && feature.properties && feature.properties[labelField]) {
//                         const label = L.marker(layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng(), {
//                             icon: L.divIcon({
//                                 className: 'map-label',
//                                 html: `<div class="label-text" style="font-size: 12px; font-weight: bold; color: ${
//                                     layerType === 'polygon' ? '#3388ff' : 
//                                     layerType === 'polyline' ? '#ff0000' :
//                                     layerType === 'point' ? '#ffb300' :
//                                     '#ffcc00'}; 
//                                     text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;">${feature.properties[labelField]}</div>`,
//                                 iconSize: [100, 20]
//                             }),
//                             interactive: false
//                         });
                        
//                         if (layerType === 'polygon') {
//                             polygonLabelsLayer.addLayer(label);
//                         } else if (layerType === 'polyline') {
//                             polylineLabelsLayer.addLayer(label);
//                         } else {
//                             pointLabelsLayer.addLayer(label);
//                         }
//                     }
//                 }
//             });
            
//             layer.addLayer(geoJsonLayer);
//         })
//         .catch(error => {
//             console.error('Error loading GeoJSON:', error);
//         });
// }

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
// Polygon layer (e.g., departments of Colombia)
loadGeoJSON('geojs/Veredas300.geojson', 
           polygonLayer, polygonStyle, 'NOMBRE_VER', 'polygon');

// First polyline layer (e.g., main roads)
loadGeoJSON('geojs/Red_TGI.geojson', 
           polyline1Layer, polyline1Style, 'TRAMO', 'polyline');

// Second polyline layer (e.g., rivers)
loadGeoJSON('https://raw.githubusercontent.com/john-guerra/colombia_maps/master/rivers.geojson', 
           polyline2Layer, polyline2Style, 'name', 'polyline');

// Point layer (e.g., postes)
loadGeoJSON('geojs/Postes.geojson', 
           pointLayer, {color: '#ff0000'}, 'PK', 'point');

// Layer control toggles
document.getElementById('polygon-layer-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polygonLayer);
    } else {
        map.removeLayer(polygonLayer);
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

document.getElementById('point-layer-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(pointLayer);
    } else {
        map.removeLayer(pointLayer);
    }
});

// Label control toggles
document.getElementById('polygon-labels-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polygonLabelsLayer);
    } else {
        map.removeLayer(polygonLabelsLayer);
    }
});

document.getElementById('polyline-labels-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polylineLabelsLayer);
    } else {
        map.removeLayer(polylineLabelsLayer);
    }
});

// Add point labels toggle (add this to your HTML first)
document.getElementById('point-labels-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(pointLabelsLayer);
    } else {
        map.removeLayer(pointLabelsLayer);
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
        <div><i class="legend-icon polygon-legend"></i> Zonas (Polígonos)</div>
        <div><i class="legend-icon polyline1-legend"></i> Vías principales</div>
        <div><i class="legend-icon polyline2-legend"></i> Ríos</div>
        <div><i class="legend-icon point-legend"></i> Postes</div>
    `;
    return div;
};

legend.addTo(map);