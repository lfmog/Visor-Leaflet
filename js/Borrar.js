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


// Custom icon for point layer (postes)
const pointIcon = L.divIcon({
    className: 'custom-fa-marker',  // Note the changed class name
    html: '<i class="fa-regular fa-plus"></i>',
    iconSize: [20, 20],            // Slightly larger for better visibility
    iconAnchor: [10, 10],           // Center anchor
    pane: 'points'
});

const polyline1Style = {
    color: '#DE1414',
    weight: 4,
    opacity: 0.8,
    pane: 'polylines'
};

// Custom style for second polyline layer (C2)
const polyline2Style = {
    color: '#5CEE0E',
    weight: 4,
    opacity: 0.8,
    pane: 'polylines'
};

const polyline3Style = {
    color: '#EE0ECC',
    weight: 4,
    opacity: 0.8,
    pane: 'polylines'
};

const polyline4Style = {
    color: '#0E30EE',
    weight: 4,
    opacity: 0.8,
    pane: 'polylines'
};

// Custom style for polygon layer
const polygonStyle = {
    fillColor: '#EDED0E',
    weight: 1,
    opacity: 1,
    color: '#EDBD0E',
    fillOpacity: 0.3,
    pane: 'polygons'  // for order control
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

// Create panes for explicit z-index control
map.createPane('polygons');
map.createPane('polylines');
map.createPane('points');

// Set z-index values (higher numbers appear above lower numbers)
map.getPane('polygons').style.zIndex = 200;
map.getPane('polylines').style.zIndex = 400;
map.getPane('points').style.zIndex = 600;
// -------------------------------------------------------------------------------
// Remove the static pointIcon constant and replace with a dynamic function
function getPointIcon(zoomLevel) {
    // Calculate size based on zoom level
    const baseSize = 14; // Base size at zoom level 12
    const size = Math.max(8, baseSize - (15 - zoomLevel)); // Adjust these values as needed
    
    return L.divIcon({
        className: 'custom-fa-marker',
        html: `<i class="fa-regular fa-plus" style="font-size: ${size}px;"></i>`,
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
                        return L.marker(latlng, { icon: pointIcon,
                            pane: 'points'
                         });
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
                                    layerType === 'polygon' ? '#000307' : 
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
loadGeoJSON('geojs/Cor_D2.geojson', 
           pointLayer, {color: '#ff0000'}, 'PK', 'point');

// First polyline layer (e.g., main roads)
loadGeoJSON('geojs/C1.geojson', 
           polyline1Layer, polyline1Style, 'TRAMO', 'polyline');

loadGeoJSON('geojs/C2.geojson', 
           polyline2Layer, polyline2Style, 'TRM_RML', 'polyline');

// Third polyline layer (e.g., rivers)
loadGeoJSON('geojs/Ducto C3.geojson', 
           polyline3Layer, polyline3Style, 'TRM_RML', 'polyline');

// Fourth layer (e.g., rivers)
loadGeoJSON('geojs/Adicional.geojson', 
           polyline4Layer, polyline4Style, 'TRM_RML', 'polyline');

// Polygon layer (e.g., departments of Colombia)
loadGeoJSON('geojs/T5.geojson', 
           polygonLayer, polygonStyle, 'VEREDA', 'polygon');


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

// Add this event listener for polygon labels
document.getElementById('polygon-labels-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(polygonLabelsLayer);
    } else {
        map.removeLayer(polygonLabelsLayer);
    }
});

// Mobile Menu Toggle
document.getElementById('mobile-menu-btn').addEventListener('click', function() {
    document.getElementById('control-panel').classList.toggle('active');
});

document.getElementById('close-panel-btn').addEventListener('click', function() {
    document.getElementById('control-panel').classList.remove('active');
});

// Collapsible Sections
// Responsive collapsible sections
document.querySelectorAll('.collapsible .section-header').forEach(header => {
    header.addEventListener('click', function() {
        this.parentElement.classList.toggle('active');
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
    });
});

// Close panel when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('control-panel');
    if (!panel.contains(e.target) && !e.target.closest('.mobile-controls')) {
        panel.classList.remove('active');
    }
});



// Measurement tool implementation
let measureControl = {
    isMeasuring: false,
    currentPolyline: null,
    totalDistance: 0,
    measurePoints: [],
    measureTooltips: [],

    start: function() {
        // Clear any previous measurements
        this.clearMeasurement();
        
        this.isMeasuring = true;
        document.getElementById('measure-toggle').classList.add('active');
        document.getElementById('measure-result').style.display = 'block';
        document.getElementById('measure-value').textContent = '0';
        
        // Start with first click
        map.on('click', this.handleMeasureClick);
    },

    stop: function() {
        this.isMeasuring = false;
        document.getElementById('measure-toggle').classList.remove('active');
        document.getElementById('measure-result').style.display = 'none';
        map.off('click', this.handleMeasureClick);
        this.clearMeasurement();
    },

    handleMeasureClick: function(e) {
        if (!measureControl.isMeasuring) return;
        
        // Add point to current measurement
        measureControl.measurePoints.push(e.latlng);
        
        // Update or create polyline
        if (measureControl.measurePoints.length > 1) {
            if (!measureControl.currentPolyline) {
                measureControl.currentPolyline = L.polyline([], {
                    color: 'red',
                    weight: 3
                }).addTo(map);
            }
            measureControl.currentPolyline.setLatLngs(measureControl.measurePoints);
            
            // Calculate and display distance
            const lastSegmentDistance = measureControl.measurePoints[measureControl.measurePoints.length-2]
                .distanceTo(measureControl.measurePoints[measureControl.measurePoints.length-1]) / 1000;
            measureControl.totalDistance += lastSegmentDistance;
            
            document.getElementById('measure-value').textContent = measureControl.totalDistance.toFixed(2);
            
            // Add tooltip for this segment
            const tooltip = L.tooltip({
                permanent: true,
                direction: 'top',
                className: 'measure-tooltip',
                content: `${lastSegmentDistance.toFixed(2)} km<br>Total: ${measureControl.totalDistance.toFixed(2)} km`
            }).setLatLng(e.latlng);
            
            tooltip.addTo(map);
            measureControl.measureTooltips.push(tooltip);
        }
    },

    clearMeasurement: function() {
        // Remove existing polyline
        if (this.currentPolyline) {
            map.removeLayer(this.currentPolyline);
            this.currentPolyline = null;
        }
        
        // Remove all tooltips
        this.measureTooltips.forEach(tooltip => map.removeLayer(tooltip));
        this.measureTooltips = [];
        
        // Reset measurements
        this.measurePoints = [];
        this.totalDistance = 0;
    }
};

// Toggle measurement tool
document.getElementById('measure-toggle').addEventListener('click', function() {
    if (measureControl.isMeasuring) {
        measureControl.stop();
    } else {
        measureControl.start();
    }
});

// Add right-click to finish measurement
map.on('contextmenu', function() {
    if (measureControl.isMeasuring) {
        measureControl.stop();
    }
});

// Coordinate display functionality
let coordFormat = 'dms'; // Default format

// Convert decimal degrees to DMS format
function decimalToDMS(decimal, isLongitude) {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
    
    let direction;
    if (isLongitude) {
        direction = decimal >= 0 ? 'E' : 'W';
    } else {
        direction = decimal >= 0 ? 'N' : 'S';
    }
    
    return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(5, '0')}"${direction}`;
}

// Format coordinates based on current format selection
function formatCoordinate(value, isLongitude) {
    if (coordFormat === 'decimal') {
        return value.toFixed(6) + '°';
    } else { // DMS
        return decimalToDMS(value, isLongitude);
    }
}

// Update coordinate display on mouse move
function updateCoordinateDisplay(latlng) {
    const lat = latlng.lat;
    const lng = latlng.lng;
    
    document.getElementById('latitude').textContent = formatCoordinate(lat, false);
    document.getElementById('longitude').textContent = formatCoordinate(lng, true);
}

// Initialize coordinate display
function initCoordinateDisplay() {
    // Set initial position (center of map)
    updateCoordinateDisplay(map.getCenter());
    
    // Update on mouse move
    map.on('mousemove', function(e) {
        updateCoordinateDisplay(e.latlng);
    });
    
    // Reset when mouse leaves map
    map.on('mouseout', function() {
        updateCoordinateDisplay(map.getCenter());
    });
    
    // Handle format change
    document.getElementById('coord-format').addEventListener('change', function(e) {
        coordFormat = e.target.value;
        updateCoordinateDisplay(map.getCenter());
    });
}

// Initialize when map is ready
map.whenReady(initCoordinateDisplay);

legend.addTo(map);