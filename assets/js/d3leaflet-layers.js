(function() {
  var root;

  root = this;

  L.GeoJSON.d3 = L.GeoJSON.extend({
    initialize: function(geojson, options) {
      this.geojson = geojson;
      options = options || {};
      options.layerId = options.layerId || ("leaflet-d3-layer-" + (Math.floor(Math.random() * 101)));
      options.onEachFeature = function(geojson, layer) {};
      L.setOptions(this, options);
      return this._layers = {};
    },
    externalUpdate:function(data){
      console.log('externalUpdate',data.features.length);
      this.geojson = data;
      this.updateData();
    },
    updateData: function() {
      var bounds, feature, g, join, path, paths, project, reset, styler, svg,map,layer_options;
      map = this._map
      g = this._g;
      svg = this._svg;
      layer_options = this.options
      if (this.geojson.type == "Topology") {
        this.geojson = root.topojson.feature(this.geojson, this.geojson.objects.features);
       
      }
     
      paths = g.selectAll("path");
      join = paths.data(this.geojson.features, function(d) {
        return d.id;
      });
      feature = join.enter().append("path");
      
      if(typeof layer_options.mouseover !='undefined'){
       
        feature.on("mouseover", function(d) {
         
          if(typeof layer_options.mouseover.style != 'undefined'){
            for(key in layer_options.mouseover.style){
              $(this).css(key,layer_options.mouseover.style[key]);
            }
          }
          
          if(typeof layer_options.mouseover.info != 'undefined'){
            
            var text = "<p>";
            layer_options.mouseover.info.forEach(function(option){
              if(typeof option.prop !== 'undefined'){
              //console.log("undefined");
              text += option.name+d.properties[option.prop]+"<br>"; 
          
              }else{
                text += ""+ option.name+"<br>";
                console.log('nah bro') ;
              } 
            })
          
            text+="</p>";
            $("#info").show().html(text);
          }
        })
        .on("mouseout", function(self) {
          if(typeof layer_options.mouseover.style != 'undefined'){
            for(key in layer_options.mouseover.style){
              $(this).css(key,layer_options.style[key]);
            }
          }
          $("#info").hide().html("");
        });
      }
      
      join.exit().remove();
      if (this.options.styler != null) {
        styler = this.options.styler;
        feature.attr("styler", function(d) {
          return d.properties[styler];
        });
      }

      if (this.options.styler != null) {
        styler = this.options.styler;
        feature.attr("styler", function(d) {
          return d.properties[styler];
        });
      }
      
     if(typeof layer_options.choropleth != 'undefined'){
        //console.log('bob ross',layer_options.choropleth);
        

        feature.attr('fill',function(d){
          return layer_options.choropleth.scale(d.properties[layer_options.choropleth.key]*1)
        
        })
      }

      project = function(d3pnt) {
        var geoPnt, pixelPnt;
        geoPnt = new L.LatLng(d3pnt[1], d3pnt[0]);
        pixelPnt = map.latLngToLayerPoint(geoPnt);
        return [pixelPnt.x, pixelPnt.y];
      };
      path = d3.geo.path().projection(project);
      bounds = d3.geo.bounds(this.geojson);
      reset = function() {
        var bottomLeft, bufferPixels, topRight;
        bufferPixels = 15;
        bottomLeft = project(bounds[0]);
        topRight = project(bounds[1]);
        svg.attr("width", topRight[0] - bottomLeft[0] + 2 * bufferPixels);
        svg.attr("height", bottomLeft[1] - topRight[1] + 2 * bufferPixels);
        svg.style("margin-left", "" + (bottomLeft[0] - bufferPixels) + "px");
        svg.style("margin-top", "" + (topRight[1] - bufferPixels) + "px");
        g.attr("transform", "translate(" + (-bottomLeft[0] + bufferPixels) + "," + (-topRight[1] + bufferPixels) + ")");
        return feature.attr("d", path);
      };
      this._map.on("viewreset", reset);
      reset();
      return this.resetFunction = reset;
    },
    onAdd: function(map) {
      var d3Selector, g, overlayPane, svg;
      this._map = map;
      overlayPane = map.getPanes().overlayPane;
      d3Selector = d3.select(overlayPane);
      this._svg = svg = d3Selector.append("svg");
      svg.attr("class", "leaflet-d3-layer");
      svg.attr("id", this.options.layerId);
      this._g = g = svg.append("g");
      g.attr("class", "leaflet-zoom-hide leaflet-d3-group");
      return this.updateData();
    },
    onRemove: function(map) {
      this._svg.remove();
      return this._map.off("viewreset", this.resetFunction);
    }
  });

  L.GeoJSON.d3.async = L.GeoJSON.d3.extend({
    initialize: function(geojsonUrl, options) {
      this.geojsonUrl = geojsonUrl;
      options = options || {};
      options.layerId = options.layerId || geojsonUrl.replace(/[^A-Za-z0-9]/g, "-");
      return L.GeoJSON.d3.prototype.initialize.call(this, null, options);
    },
    getData: function(map) {
      var mapBounds, thisLayer, url;
      mapBounds = map.getBounds().toBBoxString();
      url = "" + this.geojsonUrl;// + "&bbox=" + mapBounds;
      thisLayer = this;
      return d3.json(url, function(geojson) {
        thisLayer.geojson = geojson;
        if (thisLayer._svg != null) {
          return L.GeoJSON.d3.prototype.updateData.call(thisLayer, map);
        } else {
          return L.GeoJSON.d3.prototype.onAdd.call(thisLayer, map);
        }
      });
    },
    onAdd: function(map) {
      var newData, thisLayer;
      thisLayer = this;
      this.newData = newData = function(e) {
        return L.GeoJSON.d3.async.prototype.getData.call(thisLayer, e.target);
      };
      map.on("moveend", newData);
      return this.getData(map);
    },
    onRemove: function(map) {
      L.GeoJSON.d3.prototype.onRemove.call(this, map);
      return map.off("moveend", this.newData);
    }
  });

}).call(this);