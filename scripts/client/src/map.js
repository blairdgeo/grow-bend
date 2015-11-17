
var map;
function loadMap()
{
	map = L.map('map2D').setView([45.528, -122.680], 13);
    //L.esri.basemapLayer("Gray").addTo(map);
    //var parks = new L.esri.FeatureLayer("http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Parks/FeatureServer/0", {
    //   style: function () {
    //      return { color: "#70ca49", weight: 2 };
    //    }
    //}).addTo(map);
    L.tileLayer('https://tile-{s}.urthecast.com/v1/rgb/{z}/{x}/{y}?sensor_platform=theia', {
       maxZoom: 15
    }).addTo(map);
    //var popupTemplate = "<h3>{NAME}</h3>{ACRES} Acres<br><small>Property ID: {PROPERTYID}<small>";
    //parks.bindPopup(function(feature){
    //    return L.Util.template(popupTemplate, feature.properties)
    //});
}