var bMap;
$().ready(function() {
    "use strict";

    //mapboxgl.accessToken = 'pk.eyJ1IjoibW9ycGhvY29kZSIsImEiOiJVMnRPS0drIn0.QrB-bpBR5Tgnxa6nc9TqmQ';
    mapboxgl.accessToken = 'pk.eyJ1IjoibW9ycGhvY29kZSIsImEiOiJVMnRPS0drIn0.QrB-bpBR5Tgnxa6nc9TqmQ';

    mapboxgl.util.getJSON('data/nyc-style.json', function (err, style) {
        if (err) throw err;

        // style for the basemap
        style.layers.push({
            "id": "basemap",
            "source": "basemap",
            "style": {
                //"raster-opacity": "0.1"
                //"raster-brightness": [0, 2]
                //"raster-contrast": "5"
            },
            "type": "raster"
        });

        // generate layers for all buildings
        var minYear = 1800, maxYear = 2014;//2015;
        generateAllLayers(minYear, maxYear);

        var map = new mapboxgl.Map({
            container: 'map',
            style: style,
            center: [40.77499462,-73.98909694],
            zoom: 11
        });

        var basemap = new mapboxgl.Source({
            type: 'raster',
            //url: 'http://localhost:8000/stamen-toner.tilejson',
            url: 'http://io.morphocode.com/city-layers/data/esri-light-gray.tilejson',
            "tileSize": 256
        });
        map.addSource('basemap', basemap);


        /**
         * Generates a layer containing all buildings built during the specified year.
         *
         */
        function generateLayer(yearbuilt) {
            var layer = {
                "id": "buildings_" + yearbuilt.toString(),
                "source": "nycBuildings",
                "source-layer": "buildings_mn",
                "filter": {"year_built": yearbuilt},
                "type": "fill"
            };

            // default style of the buildings in the layer:
            layer["style"] = {
                "fill-color": "yellow",
                "fill-opacity": "0.0"
            };
            var color = scale(yearbuilt, minYear, maxYear, 0, 255),
                rgbColor = "rgb(" + color + ", " + (255-color) +" , 0)";

            // add the active class
            layer["style.active-"+yearbuilt.toString()] = {
                "fill-color": rgbColor,
                "fill-opacity": "1.0"
            };

            return layer;
        }

        /**
         * Generates all layers containing buildings for the specified period.
         */
        function generateAllLayers(minYear, maxYear) {
            for (var i = minYear; i < maxYear; i++) {
                style.layers.push(generateLayer(i));
            }
        }

        /**
         * Scales a number from one range to another
         */
        function scale(oldValue, oldMin, oldMax, newMin, newMax) {
            return (((oldValue - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin;
        }

        // listen for yearUpdate event:
        var updateTimeout;
        $(document).bind("yearUpdated", function(event, year) {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(function() {
                showAllBefore(year);
            }, 10);
        });

        /**
         * Shows all buildings up until the specified year
         */
        function showAllBefore(year) {
            for(var i = minYear; i < year; i++) {
                showByYear(i, true);
            }
            for(var j = year; j < maxYear; j++) {
                showByYear(j, false);
            }
        }

        /**
         * Shows the layer, containing buildings built during the specified year
         */
        function showByYear(year, enable) {
            var selector = "active-" + year;
            if (enable) {
                map.style.addClass(selector);
            } else {
                map.style.removeClass(selector);
            }
        }

        bMap = map;

    });

});