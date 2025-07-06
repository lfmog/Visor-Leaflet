// Initialize the map centered on Colombia
const map = L.map('map').setView([4.5709, -74.2973], 6);

// Create panes for z-index control
map.createPane('polygons');
map.createPane('polylines');
map.createPane('points');
map.createPane('labels');

// Set z-index values
map.getPane('polygons').style.zIndex = 200;
map.getPane('polylines').style.zIndex = 400;
map.getPane('points').style.zIndex = 600;
map.getPane('labels').style.zIndex = 800;

// Base maps
const baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        pane: 'tilePane'
    }),
    "ESRI Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        pane: 'tilePane'
    })
};

// Add default base map
baseMaps["OpenStreetMap"].addTo(map);

// Layer styles
const styles = {
    point: {
        icon: function(zoomLevel) {
            const size = Math.max(8, 14 - (15 - zoomLevel));
            return L.divIcon({
                className: 'custom-fa-marker',
                html: `<i class="fa-regular fa-plus" style="font-size: ${size}px;"></i>`,
                iconSize: [size, size],
                iconAnchor: [size/2, size/2],
                pane: 'points'
            });
        }
    },
    polyline1: { color: '#DE1414', weight: 4, opacity: 0.8, pane: 'polylines' },
    polyline2: { color: '#5CEE0E', weight: 4, opacity: 0.8, pane: 'polylines' },
    polyline3: { color: '#EE0ECC', weight: 4, opacity: 0.8, pane: 'polylines' },
    polyline4: { color: '#0E30EE', weight: 4, opacity: 0.8, pane: 'polylines' },
    polygon: { 
        fillColor: '#EDED0E', 
        weight: 1, 
        color: '#EDBD0E',
        fillOpacity: 0.3,
        pane: 'polygons'
    }
};

// Create layer groups
const layers = {
    point: L.layerGroup().addTo(map),
    polyline1: L.layerGroup().addTo(map),
    polyline2: L.layerGroup().addTo(map),
    polyline3: L.layerGroup().addTo(map),
    polyline4: L.layerGroup().addTo(map),
    polygon: L.layerGroup().addTo(map),
    pointLabels: L.layerGroup(),
    polylineLabels: L.layerGroup(),
    polygonLabels: L.layerGroup()
};

// Store point layers for zoom updates
const pointLayers = [];

// Base map toggles
document.getElementById('base-street')?.addEventListener('change', function() {
    if (this.checked) {
        map.removeLayer(baseMaps["ESRI Satellite"]);
        map.addLayer(baseMaps["OpenStreetMap"]);
    }
});

document.getElementById('base-satellite')?.addEventListener('change', function() {
    if (this.checked) {
        map.removeLayer(baseMaps["OpenStreetMap"]);
        map.addLayer(baseMaps["ESRI Satellite"]);
    }
});

// GeoJSON loader
const allPolylineFeatures = [];
const allFeatures = [];

function loadGeoJSON(url, layer, style, labelField, layerType = 'polygon') {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            layer.clearLayers();

            const geojson = L.geoJSON(data, {
                pointToLayer: (feature, latlng) => {
                    if (layerType === 'point') {
                        const marker = L.marker(latlng, {
                            icon: styles.point.icon(map.getZoom()),
                            pane: 'points'
                        });
                        pointLayers.push(marker);
                        feature.layer = marker;
                        feature.layerType = layerType;
                        allFeatures.push(feature);
                        return marker;
                    }
                    return L.circleMarker(latlng, style);
                },
                style: style,
                onEachFeature: (feature, lyr) => {
                    lyr.feature = feature;
                    feature.layer = lyr;
                    feature.layerType = layerType;
                    allFeatures.push(feature);

                    if (layerType === 'polyline') {
                        allPolylineFeatures.push(feature);
                    }

                    if (feature.properties) {
                        let popupContent = '<div class="info"><h4>Información</h4>';
                        for (const prop in feature.properties) {
                            popupContent += `<b>${prop}:</b> ${feature.properties[prop]}<br>`;
                        }
                        popupContent += '</div>';
                        lyr.bindPopup(popupContent);
                    }

                    if (labelField && feature.properties?.[labelField]) {
                        const position = lyr.getBounds?.().getCenter() || lyr.getLatLng();
                        const labelColor = style.color || '#000';

                        const label = L.marker(position, {
                            icon: L.divIcon({
                                className: 'map-label',
                                html: `<div style="color:${labelColor}; font-weight:bold;">${feature.properties[labelField]}</div>`
                            }),
                            interactive: false
                        });

                        const labelLayer = layerType === 'polygon' ? layers.polygonLabels :
                                            layerType === 'polyline' ? layers.polylineLabels :
                                            layers.pointLabels;

                        labelLayer.addLayer(label);
                    }
                }
            });

            geojson.addTo(layer);
        })
        .catch(err => console.error('Error loading', url, err));
}

// Load GeoJSON data
loadGeoJSON('geojs/Puntos.geojson', layers.point, {}, 'P', 'point');
loadGeoJSON('geojs/Linea C1.geojson', layers.polyline1, styles.polyline1, 'TRAMO', 'polyline');
loadGeoJSON('geojs/Linea C2.geojson', layers.polyline2, styles.polyline2, 'TRM', 'polyline');
loadGeoJSON('geojs/Linea C3.geojson', layers.polyline3, styles.polyline3, 'TRM', 'polyline');
loadGeoJSON('geojs/Linea C4.geojson', layers.polyline4, styles.polyline4, 'TRM', 'polyline');
loadGeoJSON('geojs/Veredas.geojson', layers.polygon, styles.polygon, 'VEREDA', 'polygon');

// Update point icons on zoom
map.on('zoomend', function() {
    const zoom = map.getZoom();
    pointLayers.forEach(marker => {
        marker.setIcon(styles.point.icon(zoom));
    });
});

// ==============================================
// PANEL CONTROL FUNCTIONS
// ==============================================

const panel = document.getElementById('control-panel');
const closeBtn = document.getElementById('close-panel-btn');
const menuBtn = document.getElementById('mobile-menu-btn');

// Function to toggle panel visibility with animation
function togglePanel(show) {
    if (show) {
        // Show panel - slide in from left
        panel.style.transform = 'translateX(0)';
        panel.style.display = 'block';
        panel.classList.add('active');
    } else {
        // Hide panel - slide out to left
        panel.style.transform = 'translateX(-100%)';
        
        // After animation completes, hide completely
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300); // Match this with your CSS transition duration
        
        panel.classList.remove('active');
    }
}

// Initialize panel state
togglePanel(false); // Start with panel hidden

// Close button click handler
closeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    togglePanel(false); // Hide panel
});

// Menu button click handler
menuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    togglePanel(true); // Show panel
});

// Close when clicking outside panel
document.addEventListener('click', function(e) {
    if (panel.classList.contains('active') && 
        !panel.contains(e.target) && 
        e.target !== menuBtn && 
        !menuBtn.contains(e.target)) {
        togglePanel(false);
    }
});

// Close with ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && panel.classList.contains('active')) {
        togglePanel(false);
    }
});

// ==============================================
// LAYER TOGGLES
// ==============================================

function setupToggle(id, layer) {
    document.getElementById(id)?.addEventListener('change', (e) => {
        e.target.checked ? map.addLayer(layer) : map.removeLayer(layer);
    });
}

setupToggle('point-layer-toggle', layers.point);
setupToggle('polyline1-layer-toggle', layers.polyline1);
setupToggle('polyline2-layer-toggle', layers.polyline2);
setupToggle('polyline3-layer-toggle', layers.polyline3);
setupToggle('polyline4-layer-toggle', layers.polyline4);
setupToggle('polygon-layer-toggle', layers.polygon);
setupToggle('point-labels-toggle', layers.pointLabels);
setupToggle('polyline-labels-toggle', layers.polylineLabels);
setupToggle('polygon-labels-toggle', layers.polygonLabels);

// ==============================================
// COLLAPSIBLE SECTIONS
// ==============================================

document.querySelectorAll('.control-section.collapsible').forEach(section => {
    const header = section.querySelector('.section-header');
    const content = section.querySelector('.section-content');
    const icon = header.querySelector('i');
    
    header.addEventListener('click', () => {
        const wasActive = section.classList.toggle('active');
        content.style.maxHeight = wasActive ? content.scrollHeight + 'px' : '0';
        icon.classList.toggle('fa-chevron-up', wasActive);
        icon.classList.toggle('fa-chevron-down', !wasActive);
    });
});

// ==============================================
// MEASUREMENT TOOL
// ==============================================

// Improved measurement tool implementation
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




// ==============================================
// COORDINATE DISPLAY
// ==============================================

let coordFormat = 'dms';

function decimalToDMS(decimal, isLongitude) {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
    
    const direction = isLongitude ? (decimal >= 0 ? 'E' : 'W') : (decimal >= 0 ? 'N' : 'S');
    
    return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(5, '0')}"${direction}`;
}

function formatCoordinate(value, isLongitude) {
    return coordFormat === 'decimal' ? 
        value.toFixed(6) + '°' : 
        decimalToDMS(value, isLongitude);
}

function updateCoordinateDisplay(latlng) {
    document.getElementById('latitude').textContent = formatCoordinate(latlng.lat, false);
    document.getElementById('longitude').textContent = formatCoordinate(latlng.lng, true);
}

map.on('mousemove', (e) => updateCoordinateDisplay(e.latlng));
map.on('mouseout', () => updateCoordinateDisplay(map.getCenter()));

document.getElementById('coord-format').addEventListener('change', (e) => {
    coordFormat = e.target.value;
    updateCoordinateDisplay(map.getCenter());
});

// Initialize coordinate display
updateCoordinateDisplay(map.getCenter());


legend.addTo(map);