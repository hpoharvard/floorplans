require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/TileLayer",
  "esri/layers/MapImageLayer",
  "esri/geometry/SpatialReference",
  "esri/geometry/Point",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/SimpleFillSymbol",
  "esri/renderers/UniqueValueRenderer",
  "esri/symbols/SimpleLineSymbol",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/core/urlUtils",
  "dojo/domReady!"
], function(Map, MapView, FeatureLayer, TileLayer, MapImageLayer, SpatialReference, Point, SimpleRenderer, SimpleFillSymbol,UniqueValueRenderer,
    SimpleLineSymbol, GraphicsLayer, Graphic, urlUtils) {

    var urlLearnigSpace = "https://hppm-dev.cadm.harvard.edu/arcgis/rest/services/HILT/LearningSpaces/MapServer/";
    var urlFloorPlane = "https://map.harvard.edu/arcgis/rest/services/cabotlib/CabotLibWeb/MapServer/";
    var layerbaseUrl = "https://map.harvard.edu/arcgis/rest/services/CampusBase/MapServer";
    var textLayerUrl = "https://map.harvard.edu/arcgis/rest/services/MapText/MapServer";

    var layerBase = new TileLayer({url: layerbaseUrl});
    var textLayer = new MapImageLayer(textLayerUrl, {opacity:.5});

    // Create the PopupTemplate
    var popupTemplate = {
      //title: "Marriage in NY, Zip Code: {ZIP}",
        content: "<p><b>Note</b>: {Annotation} </p>" + 
        "<p><img width='300px' src='https://map.harvard.edu/images/cabotlib/{roomimg}'></p>"
        };

    // Graphic for displaying results
    var resultsLayer = new GraphicsLayer();

    var URLparams = urlUtils.urlToObject(window.location.href);


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

    var buildingRenderer = new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: [136,0, 0, 0.7 ],
          style: "solid",
          outline: {
            width: 1,
            color: "red"
          }
        })
    });

    var floorplans = new FeatureLayer({url: urlFloorPlane + "0", outFields: ["*"], popupTemplate: popupTemplate});
    var spacePolyLayer = new FeatureLayer(urlLearnigSpace + "2",{outFields: ["*"]}); // spacePolyLayer
    
    var entranceLayer = new FeatureLayer(urlLearnigSpace + "1",{
        //definitionExpression: "ASSET_NAME = 'SCIENCE CENTER' or ASSET_NAME = 'GUND HALL' or ASSET_NAME = 'MEMORIAL HALL'"      
        definitionExpression: "ASSET_NAME = 'SCIENCE CENTER'"
    });  

    var spacePtLayer = new FeatureLayer(urlLearnigSpace + "0"); // spacePtLayer
            
    var spaceAreaLayer =  new FeatureLayer(urlLearnigSpace + "4",{
        definitionExpression: "Building_Name = 'Science Center'"
    });
    
   

    var spaceRoomLayer = new FeatureLayer(urlLearnigSpace + "2",{
        definitionExpression: "Space_Polys.Room_ID_ISIS = 'M_52633postgres'",
        renderer: buildingRenderer      
    }); // spaceRommLayer

    var map = new Map({layers: [layerBase, spaceAreaLayer, floorplans, textLayer, resultsLayer]});
        
    var view = new MapView({
            container: "viewDiv",
            map: map,
            zoom: 9,
            //center: [-71.116286, 42.37175]// longitude, latitude
            //center: new Point(760000,2962200,new SpatialReference({ wkid:2249}))
            center: new Point(759859,2962364,new SpatialReference({ wkid:2249}))
    });
    
    
    //map.add(spaceAreaLayer);
    //map.add(spacePolyLayer);
    map.add(entranceLayer);
    //map.add(spaceRoomLayer);
    //map.add(floorplans);
    

    //console.log(URLlevel)
    if(URLlevel!= null){
            view.zoom = URLlevel-1; // http://localhost/2017/hpo/hilt/new/?level=5
            URLlevel = null;
    } 
    
    /*if(URLbld!= null && URLfloor!= null){
            spacePolyLayer.definitionExpression = "Space_Polys.Building_Name = '" + URLbld + "' and  " + "CombinedSpace.Floor_Number = '" + URLfloor + "'" ;
            spaceAreaLayer.definitionExpression = "Building_Name = '" + URLbld + "'";
            entranceLayer.definitionExpression = "ASSET_NAME = '" + URLbld.toUpperCase() + "'";
            URLbld = null;
            URLfloor = null;
    }

    if(URLbld!= null && URLfloor == null){
            spacePolyLayer.definitionExpression = "Space_Polys.Building_Name = '" + URLbld + "'" ;
            spaceAreaLayer.definitionExpression = "Building_Name = '" + URLbld + "'";
            entranceLayer.definitionExpression = "ASSET_NAME = '" + URLbld.toUpperCase() + "'";
            URLbld = null;
    }

    if(URLbld == null && URLfloor!= null){
            spacePolyLayer.definitionExpression = "CombinedSpace.Floor_Number = '" + URLfloor + "'" ;
            //spaceAreaLayer.definitionExpression = "Building_Name = '" + URLbld + "'";
            //entranceLayer.definitionExpression = "ASSET_NAME = '" + URLbld.toUpperCase() + "'";
            URLfloor = null;
    }*/
    // check url floor paremeter
    if(URLfloor!= null){
            floorplans.definitionExpression = "Floor = '" + URLfloor + "'";
            //spaceAreaLayer.definitionExpression = "Building_Name = '" + URLbld + "'";
            //entranceLayer.definitionExpression = "ASSET_NAME = '" + URLbld.toUpperCase() + "'";
            URLfloor = null;
    }
    // check url room paremeter
    if(URLroom!= null){            
            floorplans.definitionExpression = "roomnumber = '" + URLroom + "'";
            console.log(URLroom)
            view.whenLayerView(floorplans).then(function(lyrView){
                lyrView.watch("updating", function(val){
                    if(!val){  // wait for the layer view to finish updating
                        lyrView.queryFeatures().then(function(results){
                            console.log(results[0]);  // prints all the client-side graphics to the console
                            var pGraphic = new Graphic({
                                geometry: results[0].geometry,
                                symbol: new SimpleFillSymbol({
                                    color: [ 0, 255, 0, 1],
                                    style: "solid",
                                    outline: {  // autocasts as esri/symbols/SimpleLineSymbol
                                        color: "#009900",
                                        width: 2
                                    }
                                })
                            });
                            
                            resultsLayer.add(pGraphic);
                        });
                    }
                });
            }); 
            URLroom = null;
    }
    // check url room type paremeter
    var highlight;
    
    if(URLtype!= null){            
        floorplans.definitionExpression = "Annotation = '" + URLtype + "'";
        console.log(URLtype)        
        URLtype = null;

    }

    if(URLctrX!= null && URLctrY !=null){
            console.log(URLctrY, URLctrX)
            view.center = new Point(URLctrX, URLctrY,new SpatialReference({ wkid:2249})); // http://localhost/2017/hpo/hilt/new/?level=5
            URLctrX = null;
            URLctrY = null;
    } 

    view.on("click", function (e){
            //console.log(e)
            document.getElementById("infolatlng").innerHTML = ""
            document.getElementById("infolatlng").innerHTML = "ctrx=" + e.mapPoint.x.toFixed(0) + "&ctry=" + e.mapPoint.y.toFixed(0) + "&level=" + view.zoom
            //var screenPoint = e.screenPoint;
            view.hitTest(e.screenPoint).then(getGraphics);

                        
    });

    
  
    
    function getGraphics(response) {
        resultsLayer.removeAll();
        var pGraphic = new Graphic({
            geometry: response.results[0].graphic.geometry,
            symbol: new SimpleFillSymbol({
                color: [ 0, 255, 0, 1],
                style: "solid",
                outline: {  // autocasts as esri/symbols/SimpleLineSymbol
                    color: "#009900",
                    width: 2
                }
            })
        });
        
        resultsLayer.add(pGraphic);
        
    };

    


});

