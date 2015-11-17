(function() {
    'use strict';

    urbanlayers.map.build = build;
    urbanlayers.map.isLoaded = isLoaded;
    urbanlayers.map.map = map;

    var minYear = 1990,
        maxYear = 2015,
        _map,
        _isLoaded = false,

        // colors
        yellow = d3.rgb(254, 190, 18).toString(),
        gray0 = d3.rgb(55, 55, 55).toString(),
        gray1 = d3.rgb(93, 92, 93).toString(),
        gray2 = d3.rgb(183, 183, 183).toString(),
        red0 = d3.rgb(219, 58, 27).toString(),
        red1 = d3.rgb(232, 92, 65).toString(),
        red2 = d3.rgb(238, 131, 110).toString(),
        palette0 = [gray0, 'rgb(68, 154, 136)', red0, 'rgb(44, 154, 183)', gray0],
        palette1 = [red1, red2, yellow, 'rgb(127,205,187)', 'rgb(65,182,196)', 'rgb(29,145,192)', 'rgb(34,94,168)', 'rgb(12,44,132)'],
        colorScale = d3.scale.quantile()
                        // using 1855 for start, because there are less buildings built before that date. Using 1765 for minimum "shifts" the visual result towards the blue gamma
                        // using 2015 for max range, to achieve exact intervals of 20 years: 1895, 1915, 1935, etc
                        .domain(d3.range(1992, 2015 + 1))
                        //.range(colorbrewer.RdYlBu[9]),
                        //.range(colorbrewer.Spectral[9]),
                        //.range(colorbrewer.BrBG[9]),
                        //.range(d3.scale.category10().range()),
                        //.range(d3.scale.category20b().range()),
                        .range(palette1),

        options = {transition: false};


    /**
     * Loads the style and builds the mapbox gl map
     *
     * returns promise
     */
    function build() {

        var dfd = new jQuery.Deferred();

        mapboxgl.util.getJSON('data/bend-style.json', function (err, style) {
            if (err) throw err;

            // enable more details ... this prooved to break rendering with some browsers
            // so we only enable it conditionally
            if (urbanlayers.util.detailMode()) {
                style.sources["bend_oregon_taxlots"].url = "http://bend.smartmine.com/data/bend-tiles.tilejson";
            }


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
            style.layers = style.layers.concat(generateAllLayers(minYear, maxYear));
            //fix for non-mapped buildings:
            var nonmappedLayer = generateLayer(0);

            console.log("Layers", style.layers);
            style.layers.push(nonmappedLayer);

            // init the _map
            _map = new mapboxgl.Map({
                container: 'map',
                style: style,
                center: [ 44.057, -121.3092],
                minZoom: 10,
                zoom: 10,
                maxZoom: (urbanlayers.util.detailMode()) ? 14: 14
            });

            // always show non-_mapped buildings
            _map.style.addClass("active-0");

            // add the compass
            _map.addControl(new mapboxgl.Navigation());


            // Preload the largest map tiles -----------------------------------------------------------------------------
            var buildingsSource = _map.sources['bend_oregon_taxlots'];

            console.log("Building Source!", buildingsSource);
            // Init the loader button - we're using ladda
            // https://github.com/hakimel/Ladda
            var button = document.querySelector( '#btn-get-started-loader' );
            var l = Ladda.create(button);
            l.start();
            l.setProgress(0);

            // for development purposes... go to map directly
            if (urbanlayers.util.debugMode()) {
                l.toggle();
            }

            // patch ladda.js, to use the clip property instead of the width for the progress bar
            // this fixes issue with transparent backgrounds
            var baseSetProgress = l.setProgress;
            l.setProgress = function(progress) {
                baseSetProgress(progress);

                progress = Math.max( Math.min( progress, 1 ), 0 );
                var progressElement = button.querySelector( '.ladda-progress' );
                if (progressElement) {
                    progressElement.style.clip = 'rect(0px, ' + ( progress || 0 ) * button.offsetWidth + 'px, 80px, 0px)';
                }
            };

            // list of pbf tiles, that we need to pre-load
            var tilesQueue = [
                '10/167/371',
                '10/167/372'
                //'11/601/769',
                //'11/603/770'
            ], totalCount = tilesQueue.length;
            
            // listen for tiles being loaded
            buildingsSource.on('tile.load', function(event) {
                console.log("Tile Loaded!");
                var tile = event.tile;
                //console.log(tile.url);
                // remove the tile from the queue, once loaded
                for (var i = 0; i < tilesQueue.length; i++) {
                    if (tile.url.indexOf(tilesQueue[i]) > -1) {
                        tilesQueue.splice(i, 1);
                        break;
                    }
                }

                // update the loader progress:
                var progress = (totalCount - tilesQueue.length) / totalCount;
                l.setProgress(progress);

                // Once there are no more tiles left in the queue - we're done
                if (tilesQueue.length == 0) {
                    $('html').toggleClass("tiles-loaded", true);

                    // hide the loader -> show the button
                    l.toggle();
                    l.stop();

                    _isLoaded = true;
                }
            });

                   // l.stop();
                   //_isLoaded = true;


            // Add the Basemap -----------------------------------------------------------------------------
            var basemap = new mapboxgl.Source({
                type: 'raster',
                //url: 'http://io.morphocode.com/urban-layers/data/stamen-toner-lite.tilejson',
                url: 'http://io.morphocode.com/urban-layers/data/esri-light-gray.tilejson',
                "tileSize": 256
            });
            _map.addSource('basemap', basemap);

            // Update the _map, when the time period has been changed:
            var startYear = minYear,
                endYear = minYear,
                updateTimeout;

            $(document).bind("slider-range-end", function(event, year) {
                endYear = year;
                // prevent updates if the slider moves too fast
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(function() {
                    showAllBetween(startYear, endYear);
                }, 1);
            });

            $(document).bind("slider-range-start", function(event, year) {
                startYear = year;
                // prevent updates if the slider moves too fast
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(function() {
                    showAllBetween(startYear, endYear);
                }, 1);
            });

            buildLegend();

            dfd.resolve(_map);

        });

        return dfd.promise();
    }

    /**
     * Generates a layer containing all buildings built during the specified year.
     */
    function generateLayer(yearbuilt) {
        var color = (yearbuilt > 0) ? colorScale(yearbuilt) : gray2;
        // if built before 1855
        if (yearbuilt > 0 && yearbuilt < colorScale.domain()[0]) {
            color = red0;
        }

        var layer = {
            "id": "buildings_" + yearbuilt.toString(),
            "source": "bend_oregon_taxlots",
            "source-layer": "bend_oregon_taxlots",
            "filter": {"yearbuilt": yearbuilt.toString()},
            "type": "fill"
        };

        // default style of the buildings in the layer:
        layer["style"] = {
            "fill-color": "yellow",
            "fill-opacity": "0.0"
        };

        // add the active class
        layer["style.active-"+yearbuilt.toString()] = {
            "fill-color": color,
            "fill-opacity": "0.7"
        };

        return layer;
    }

    /**
     * Generates all layers containing buildings for the specified period.
     */
    function generateAllLayers(minYear, maxYear) {
        var layers = [];
        for (var i = minYear; i < maxYear; i++) {
            layers.push(generateLayer(i));
        }
        return layers;
    }

    var updateTimeout,
        needsUpdate = true,
        lastEndYear,
        lastStartYear;

    /**
     * Shows all buildings for the specified period
     */
    function showAllBetween(startYear, endYear) {

        // ensure updates at a max of 100ms frequency
        lastStartYear = startYear;
        lastEndYear = endYear;
        if (!needsUpdate) return;
        needsUpdate = false;

        //console.log(Date.now());
        //console.log("Show all between: " + startYear + " and " + endYear);

        updateTimeout = setTimeout(function() {
            needsUpdate = true;

            if (lastStartYear != startYear || lastEndYear != endYear) {
                showAllBetween(lastStartYear, lastEndYear);
            }
        }, 100);

        //startYear = 1990;
        var classes = [];
        for(var i = startYear; i <= endYear; i++) {
            classes.push("active-" + i);
        }

        // show the selected layers
        _map.style.addClasses(classes);

        // remove inactive years
        classes = [];
        for(var j = minYear; j < startYear; j++) {
            classes.push("active-" + j);
        }
        for(var j = endYear+1; j < maxYear; j++) {
            classes.push("active-" + j);
        }

        _map.style.removeClasses(classes);
        _map.style.update(options);

    }

    /**
     * Build the legend
     */
    function buildLegend() {
        var legend = d3.select('#legend #color-gradient')
          .append('ul')
            .attr('class', 'list-inline');

        var legendColors = colorScale.range();

        var keys = legend.selectAll('li.key')
            .data(colorScale.range());

        // color key for missing data:
        legend.append('li')
            .style('border-top-color', gray2)
            .text('No Data');

        // color key for buildings built prior 1855
        legend.append('li')
            .style('border-top-color', red0)
            .text(minYear);
            //.text('pre ' + colorScale.domain()[0]);

        // color keys of the range
        keys.enter().append('li')
            .style('border-top-color', String)
            .text(function(d) {
                // retrieves the year boundary for each color
                // for ex. "#db3a1b" -> [1840, 1861.625]
                var r = colorScale.invertExtent(d);
                return Math.round(r[0]);
            });
    }


    /**
     * Patches the original mapbox gl js lib in order to improve performance
     */
    (function patch() {
        /**
         * Updates the viewport
         */
        mapboxgl.Style.prototype.update = function(options) {
            this.cascade(options);
        };

        /**
         * Adds all the specified classes to the map, without updating the view
         */
        mapboxgl.Style.prototype.addClasses = function(n, options) {
            var needsUpdate = false;
            for (var i = 0, c; c = n[i]; i++) {
                this.classes[c] = true;
            }
        };

        /**
         * Remove all the specified classes from the map, without updating the view
         */
        mapboxgl.Style.prototype.removeClasses = function(n, options) {
            var needsUpdate = false;
            for (var i = 0, c; c = n[i]; i++) {
                delete this.classes[c];
            }
        };
    })();

    /**
     * Is the map loaded, i.e. all required tiles are loaded and ready for presentation
     */
    function isLoaded() {
        return _isLoaded;
    }

    /**
     * returns the map instance
     */
    function map() {
        return _map;
    }

})();