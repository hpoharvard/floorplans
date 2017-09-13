// code by Giovanni Zambotti - 20 August 2017
require([
      "esri/Map",
      "esri/views/MapView",      
      "esri/widgets/Locate",
      "esri/layers/FeatureLayer",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",
      "esri/layers/MapImageLayer",
      "esri/layers/TileLayer",
      "esri/renderers/SimpleRenderer",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/symbols/SimpleFillSymbol",
      "esri/renderers/UniqueValueRenderer",
      "esri/geometry/Extent",
      "esri/widgets/Popup",
      "esri/geometry/SpatialReference",
      "esri/geometry/Point",
      "esri/core/urlUtils",

      // Bootstrap
      "bootstrap/Dropdown",
      "bootstrap/Collapse",      

      // Calcite Maps
      "calcite-maps/calcitemaps-v0.3",

      "dojo/domReady!"
    ], //function(Map, MapView, FeatureLayer, GraphicsLayer,Graphic, MapImageLayer, TileLayer, SimpleRenderer, SimpleMarkerSymbol, 
      //SimpleFillSymbol, UniqueValueRenderer) {
      function(Map, MapView, Locate, FeatureLayer, GraphicsLayer, Graphic, MapImageLayer, TileLayer, SimpleRenderer, SimpleMarkerSymbol, 
      SimpleFillSymbol, UniqueValueRenderer, Extent, Popup, SpatialReference, Point, urlUtils) {

      var URLparams = urlUtils.urlToObject(window.location.href);
      //var popup;

      if(URLparams.query){
          var URLlevel = (URLparams.query.level) ? parseInt(URLparams.query.level) : null; // zoom level
          var URLbld = (URLparams.query.bld) ? URLparams.query.bld : null; // buidling name
          var URLfloor = (URLparams.query.floor) ? URLparams.query.floor : null; // floor name
          var URLroom = (URLparams.query.room) ? URLparams.query.room : null; // room number
          var URLtype = (URLparams.query.type) ? URLparams.query.type : null; // room type
          var URLctrX = (URLparams.query.ctrx) ? parseInt(URLparams.query.ctrx) : null;   // map center point x coord
          var URLctrY = (URLparams.query.ctry) ? parseInt(URLparams.query.ctry) : null;   // map center point y coord      
      } else {
          var URLlevel = null;
          var URLbld = null;
          var URLfloor = null;
          var URLroom = null;
          var URLtype = null;
          var URLctrX = null;
          var URLctrY = null;                                
      }

      // Graphic for displaying results
      var resultsLayer = new GraphicsLayer(); 

      var urlLearnigSpace = "https://hppm-dev.cadm.harvard.edu/arcgis/rest/services/HILT/LearningSpaces/MapServer/";
      var urlFloorPlane = "https://map.harvard.edu/arcgis/rest/services/cabotlib/CabotLibWeb/MapServer/";
      var layerbaseUrl = "https://map.harvard.edu/arcgis/rest/services/CampusBase/MapServer";
      var textLayerUrl = "https://map.harvard.edu/arcgis/rest/services/MapText/MapServer";

      var layerBase = new TileLayer({url: layerbaseUrl});
      var textLayer = new MapImageLayer(textLayerUrl, {opacity:.5});
      var entranceLayer = new FeatureLayer(urlLearnigSpace + "1",{definitionExpression: "ASSET_NAME = 'SCIENCE CENTER'"});

      var popupTemplate = {
        title: "{Annotation}",        
        content: "<p>Room Number: {roomnumber}</p><p>Capacity: {Capacity}</p><p><img width='250px' src='https://map.harvard.edu/images/cabotlib/{roomimg}'></p>",
        actions:[{id:"cabotlib_pop", image: "css/images/library.png", title: "Cabot Library"},{id:"roombook_pop", image: "css/images/time.png", title: "Room Book"}]            
        
      }; 

      popupTemplate.overwriteActions = true;

      var popupTemplateReservation = {
        title: "{Annotation}",        
        content: "<p>Room Number: {roomnumber}</p><p>Capacity: {Capacity}</p><p><img width='250px' src='https://map.harvard.edu/images/cabotlib/{roomimg}'></p>",
        actions:[{id:"cabotlib_pop", image: "css/images/library.png", title: "Cabot Library"}]            
        
      }; 
      
      popupTemplateReservation.overwriteActions = true;

      var myzoom = 11, lon = 759859, lat = 2962364;

      var xMax = -7915458.81211143;
      var xMin = -7917751.9229597915;
      var yMax = 5217414.497463334;
      var yMin = 5216847.191394078;      

      var isMobile = {
          Android: function() {
              return navigator.userAgent.match(/Android/i);
          },
          BlackBerry: function() {
              return navigator.userAgent.match(/BlackBerry/i);
          },
          iOS: function() {
              return navigator.userAgent.match(/iPhone|iPad|iPod/i);
          },
          Opera: function() {
              return navigator.userAgent.match(/Opera Mini/i);
          },
          Windows: function() {
              return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
          },
          any: function() {
              return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
          }
      };

      if( isMobile.any() ) {
        myzoom = 16; 
        lon = 759859; 
        lat = 2962364;
        xMax = -7916229.045165166; 
        xMin = -7917088.961733397;
        yMax = 5217530.483504136;
        yMin = 5216121.17579509;
      };

      var floorRenderer = new UniqueValueRenderer({
        field: "reservation",
        defaultSymbol: new SimpleFillSymbol()
      });

      floorRenderer.addUniqueValueInfo(1,
        new SimpleFillSymbol({
          color: [78,132,196, 0.8],
          style: "solid",
          outline: {
            width: 2,
            color: [89, 89, 89]
          }
        })
      );
      // All features with value of "South" will be red
      floorRenderer.addUniqueValueInfo({
        value: 0,
        symbol: new SimpleFillSymbol({
          color: [204, 204, 204, 0.8],
          style: "solid",
          outline: {
            width: 2,
            color: [89, 89, 89]
          }
        })
      });

      var floorRendererSelect = new SimpleRenderer({
        symbol: new SimpleFillSymbol({
            color: [ 0, 255, 0, 1],
            style: "solid",
            outline: {  // autocasts as esri/symbols/SimpleLineSymbol
                color: "#009900",
                width: 2
            }
        })
      });
      
      var floorplans = new FeatureLayer({url: urlFloorPlane + "0", outFields: ["Annotation", "Capacity", "roomnumber","roomimg", "reservation"], definitionExpression: "floor = 'L'", renderer: floorRenderer});
      var floorplansSelect = new FeatureLayer({url: urlFloorPlane + "0", outFields: ["Annotation", "Capacity", "roomnumber","roomimg", "reservation"], renderer: floorRendererSelect});
      
      var map = new Map({layers: [layerBase, textLayer, floorplans, entranceLayer]});

      var view = new MapView({
        container: "mapViewDiv",
        map: map,
        center: new Point(lon,lat,new SpatialReference({ wkid:2249})),
        //center: [lon, lat], /*-71.11607611178287, 42.37410778220068*/
        zoom: myzoom,        
        padding: {top: 50, bottom: 0}, 
        breakpoints: {xsmall: 768, small: 769, medium: 992, large: 1200},
        popup: {
          dockEnabled: true,
          dockOptions: {
            // Disables the dock button from the popup
            buttonEnabled: false,
            // Ignore the default sizes that trigger responsive docking
            breakpoint: false,
            position: "top-center"
          }
        }     
      });
               
      // Disables map rotation
      view.constraints = {rotationEnabled: true};
                   
      /********************************
      * Create a locate widget object.
      *********************************/        
      var locateBtn = new Locate({view: view});

      // Add the locate widget to the top left corner of the view
      view.ui.add(locateBtn, {position: "top-left"});
              
      var floorLevel = document.getElementById("infoFloorLevel");

      floorLevel.addEventListener("change", function() {        
        var floorLevel = document.getElementById("infoFloorLevel");        
        floorplans.definitionExpression = "Floor = '" + floorLevel[floorLevel.options.selectedIndex].value + "'";
        view.popup.visible = false;
        resultsLayer.removeAll();
      });
   
      
      if(URLlevel!= null){
        view.zoom = URLlevel-1; // http://localhost/2017/hpo/hilt/new/?level=5
        URLlevel = null;
      }

      if(URLfloor!= null){
        floorplans.definitionExpression = "Floor = '" + URLfloor + "'";
        if(URLfloor == 'L'){floorLevel.options[1].selected = true;}
        else if(URLfloor == 'LL'){floorLevel.options[2].selected = true;}
        else if(URLfloor == 'L2'){floorLevel.options[3].selected = true;}  
        URLfloor = null;
      }
    
    // check url floor paremeter
    if(URLroom!= null){            
        floorplansSelect.definitionExpression = "roomnumber = '" + URLroom + "'";
        map.add(floorplansSelect);
        var floorLevel = document.getElementById("infoFloorLevel");
        view.popup.location = view.center;
        view.whenLayerView(floorplansSelect).then(function(lyrView){
          lyrView.watch("updating", function(val){
              if(!val){  // wait for the layer view to finish updating
                  lyrView.queryFeatures().then(function(results){
                      console.log(results[0].attributes.reservation);  // prints all the client-side graphics to the console
                      view.popup.title = results[0].attributes.Annotation;
                      
                      if(results[0].attributes.reservation == 0){
                        view.popup.content = "<p>Room Number: " + results[0].attributes.roomnumber + "</p><p>Capacity: " + results[0].attributes.Capacity + "</p><p><img width='250px' src='https://map.harvard.edu/images/cabotlib/" + results[0].attributes.roomimg + "'></p>",
                        view.popup.actions = [{id:"cabotlib_pop", image: "css/images/library.png", title: "Cabot Library"}]            
                       
                      }
                      else{
                        view.popup.content = "<p>Room Number: " + results[0].attributes.roomnumber + "</p><p>Capacity: " + results[0].attributes.Capacity + "</p><p><img width='250px' src='https://map.harvard.edu/images/cabotlib/" + results[0].attributes.roomimg + "'></p>",
                        view.popup.actions = [{id:"cabotlib_pop", image: "css/images/library.png", title: "Cabot Library"},{id:"roombook_pop", image: "css/images/time.png", title: "Room Book"}]            
                      }
                      
                      view.popup.visible = true;                

                  });
                }
            });
        });             
        URLroom = null;
    }
    // check url room type paremeter
    var highlight;
    
    if(URLtype!= null){            
        floorplansSelect.definitionExpression = "Annotation = '" + URLtype + "'";
        map.add(floorplansSelect);
        console.log(floorplansSelect)
        view.popup.location = view.center;
        view.whenLayerView(floorplansSelect).then(function(lyrView){
          lyrView.watch("updating", function(val){
              if(!val){  // wait for the layer view to finish updating
                  lyrView.queryFeatures().then(function(results){
                      console.log(results[0].attributes.reservation);  // prints all the client-side graphics to the console
                      view.popup.title = results[0].attributes.Annotation;
                      
                      if(results[0].attributes.reservation == 0){
                        view.popup.content = "<p>Room Number: " + results[0].attributes.roomnumber + "</p><p>Capacity: " + results[0].attributes.Capacity + "</p><p><img width='250px' src='https://map.harvard.edu/images/cabotlib/" + results[0].attributes.roomimg + "'></p>",
                        view.popup.actions = [{id:"cabotlib_pop", image: "css/images/library.png", title: "Cabot Library"}]            
                       
                      }
                      else{
                        view.popup.content = "<p>Room Number: " + results[0].attributes.roomnumber + "</p><p>Capacity: " + results[0].attributes.Capacity + "</p><p><img width='250px' src='https://map.harvard.edu/images/cabotlib/" + results[0].attributes.roomimg + "'></p>",
                        view.popup.actions = [{id:"cabotlib_pop", image: "css/images/library.png", title: "Cabot Library"},{id:"roombook_pop", image: "css/images/time.png", title: "Room Book"}]            
                      }
                      
                      view.popup.visible = true;                

                  });
                }
            });
        });

        URLtype = null;

    }

    if(URLctrX!= null && URLctrY !=null){
            console.log(URLctrY, URLctrX)
            view.center = new Point(URLctrX, URLctrY,new SpatialReference({ wkid:2249})); // http://localhost/2017/hpo/hilt/new/?level=5
            URLctrX = null;
            URLctrY = null;
    }


    view.on("click", function (e){
      //console.log(e);        
      //var screenPoint = e.screenPoint;     
      view.hitTest(e.screenPoint).then(getGraphics);                    
    }); 
    
    view.popup.on("trigger-action", function(event){
        
        if(event.action.id === "cabotlib_pop"){
          window.open("https://cabot.library.harvard.edu/");
        }
        else if ( event.action.id  === "roombook_pop"){
        
          window.open("https://roombook.fas.harvard.edu/VirtualEMS/RoomRequest.aspx?data=ity3Dem%2byxxGFZTQvNr979PTZkmRU0pX");
          
        }
      }); 


    function getGraphics(response) {
        //console.log(response.results[0].graphic.geometry)
        resultsLayer.removeAll();
        var pGraphic = new Graphic({
            geometry: response.results[0].graphic.geometry,
            symbol: new SimpleFillSymbol({
                color: [ 0, 255, 0, 1],
                style: "solid",
                outline: {  // autocasts as esri/symbols/SimpleLineSymbol
                    color: "009900",
                    width: 2
                }
            })
        });
        
               
        resultsLayer.add(pGraphic);
        map.add(resultsLayer)

        if(response.results[0].graphic.attributes.reservation == 0){
          floorplans.popupTemplate = popupTemplateReservation;
          popup = view.popup;
        }
        else{
         floorplans.popupTemplate = popupTemplate;
          popup = view.popup; 
        }        
    }       
      
          
      
});