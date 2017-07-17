require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/TileLayer",
  "esri/layers/MapImageLayer",
  "esri/geometry/SpatialReference",
  "esri/geometry/Point",
  "esri/core/urlUtils",
  "dojo/domReady!"
], function(Map, MapView, FeatureLayer, TileLayer, MapImageLayer, SpatialReference, Point, urlUtils) {

    var urlLearnigSpace = "https://hppm-dev.cadm.harvard.edu/arcgis/rest/services/HILT/LearningSpaces/MapServer/";
    var layerbaseUrl = "https://map.harvard.edu/arcgis/rest/services/CampusBase/MapServer";
    var textLayerUrl = "https://map.harvard.edu/arcgis/rest/services/MapText/MapServer";

    var layerBase = new TileLayer({url: layerbaseUrl});
    var textLayer = new MapImageLayer(textLayerUrl, {opacity:.5});

    var URLparams = urlUtils.urlToObject(window.location.href);
    if(URLparams.query){
            var URLlevel = (URLparams.query.level) ? parseInt(URLparams.query.level) : null; // initial zoom level
            var URLbld = (URLparams.query.bld) ? URLparams.query.bld : null; // initial zoom level
            var URLfloor = (URLparams.query.floor) ? URLparams.query.floor : null; // initial zoom level
            var URLctrX = (URLparams.query.ctrx) ? parseInt(URLparams.query.ctrx) : null;         // map center point x coord
            var URLctrY = (URLparams.query.ctry) ? parseInt(URLparams.query.ctry) : null;   // map center point y coord
                            
            
    } else {
            var URLlevel = null;
            var URLbld = null;
            var URLfloor = null;
            var URLctrX = null;
            var URLctrY = null;                                
    }


    var map = new Map({layers: [layerBase, textLayer]});

    
    var entranceLayer = new FeatureLayer(urlLearnigSpace + "1",{
            definitionExpression: "ASSET_NAME = 'SCIENCE CENTER' or ASSET_NAME = 'GUND HALL' or ASSET_NAME = 'MEMORIAL HALL'"      
    });
            
    var spacePtLayer = new FeatureLayer(urlLearnigSpace + "0", {
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["CombinedSpace.Room_ID_Source","CombinedSpace.Room_Number", "Space_Pts.Room_ID_ISIS","Space_Pts.Root","Space_Pts.Floor","CombinedSpace.Actual_SF", "CombinedSpace.Room_Function__FICM_T2_"]
    }); // spacePtLayer
            
    var spaceAreaLayer =  new FeatureLayer(urlLearnigSpace + "4");
    
    var spacePolyLayer = new FeatureLayer(urlLearnigSpace + "2", {
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["CombinedSpace.Room_ID_Source", "CombinedSpace.Room_Number", "Space_Polys.Room_ID_ISIS","Space_Polys.Root","Space_Polys.Floor","CombinedSpace.Actual_SF", "CombinedSpace.Room_Function__FICM_T2_"],
            supportsAdvancedQueries: true,
            //definitionExpression: "Space_Polys.Building_Name = 'Science Center' and CombinedSpace.Floor_Number = '-1'"
    }); // spacePolyLayer
    
    var view = new MapView({
            container: "viewDiv",
            map: map,
            zoom: 8,
            //center: [-71.116286, 42.37175]// longitude, latitude
            center: new Point(760000,2962200,new SpatialReference({ wkid:2249}))
    });
    
    
    map.add(spaceAreaLayer);
    map.add(spacePolyLayer);
    map.add(entranceLayer);
    //map.add(spacePtLayer);
    console.log(URLlevel)
    if(URLlevel!= null){
            view.zoom = URLlevel-1; // http://localhost/2017/hpo/hilt/new/?level=5
            URLlevel = null;
    } 
    
    if(URLbld!= null && URLfloor!= null){
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
    }

    if(URLctrX!= null && URLctrY !=null){
            console.log(URLctrY, URLctrX)
            view.center = new Point(URLctrX, URLctrY,new SpatialReference({ wkid:2249})); // http://localhost/2017/hpo/hilt/new/?level=5
            URLctrX = null;
            URLctrY = null;
    } 

    view.on("click", function (e){
            console.log(e.mapPoint.x.toFixed(0),e.mapPoint.y.toFixed(0), view.zoom)
            document.getElementById("infolatlng").innerHTML = ""
            document.getElementById("infolatlng").innerHTML = "ctrx=" + e.mapPoint.x.toFixed(0) + "&ctry=" + e.mapPoint.y.toFixed(0) + "&level=" + view.zoom
    });

});