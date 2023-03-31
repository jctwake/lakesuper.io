//import activityLocationData from '../resources/location_to_activity.json' assert {type: 'json'};
import activityLocationData from '../resources/location_to_activity.json' assert {type: 'json'};
import { fetchDataForActivityLocation, populateActivityHours } from './activity.js';

const superCache = await caches.open('super-cache');
  var map;
  var geoJSON;
  var request;
  let results = [];
  var gettingData = false;
  var fetchMoreData = true;
  var activityHours = new Map();
  var now = new Date();
  const forecastDays = 3;
  const currentHour = now.getHours()

  function initialize() {
    var mapOptions = {
      zoom: 9,
      center: new google.maps.LatLng(47.3,-91.7)
    };

    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    
        // Add interaction listeners to make weather requests
    google.maps.event.addListener(map, 'idle', checkIfDataRequested);

    // Sets up and populates the info window with details
    map.data.addListener('click', function(event) {
      var contentString = "<img src=" + event.feature.getProperty("infoIcon") + ">"
       + "<br /><strong>" + event.feature.getProperty("label") + "</strong>";
      
       var activity = event.feature.getProperty("activity");
      Object.keys(activity).forEach(key => {
          var keyValString = "<br />" + activity[key];
          contentString += keyValString;
        });
      infowindow.setContent(contentString);

      infowindow.setOptions({
          position:{
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          },
          pixelOffset: {
            width: 0,
            height: -15
          }
        });
      map.setCenter(event.latLng);
      map.setZoom(12);
      infowindow.open(map);
    });
  }

  var infowindow = new google.maps.InfoWindow();

  //var output = document.getElementById("hour-label");
  //slider.value = currentHour;
  export var updateSliderValue = function(value) {
    //console.log("value " + value);
    map.setZoom(9);
    resetData();
    infowindow.close();
    var hourValue = Number(value);
    if (activityHourIsValid(hourValue)) {
      drawIconsForActivityHour(hourValue);
      drawIconsForActivities(activityHours.get(hourValue));
    }
  }

  export var getTimeFromCurrentActivityHour = function(hour) {
    // var timeToReturn;
    // if (activityHourIsValid(hour)) {
    //   var firstActivity = activityHours.get(hour)[0];
    //   timeToReturn = firstActivity.properties["time"];
    // } else {
    //   timeToReturn = new Date();
    // }
    // return timeToReturn;
   var firstActivity = activityHours.get(hour)[0];
   return firstActivity.properties["time"];
  }

  export var getActivitiesForHour = function(hour) {
    var activity = activityHours.get(hour);
    return activity;
  }


  var activityHourIsValid = function(hour) {
    if (activityHours.get(hour) && activityHours.get(hour).length > 0) {
      return true;
    }
    return false;
  }

  var checkIfDataRequested = function() {
    // Stop extra requests being sent
    while (gettingData === true) {
      request.abort();
      gettingData = false;
    }

    if (fetchMoreData === true) {
      getActivityDataFromJSON();
    }
  };


  async function getActivityDataFromJSON () {
    const promises = [];

    var activityLocations = (activityLocationData && activityLocationData.length > 0) ? activityLocationData : activityLocationDataLocal;

    // fire all requests
    activityLocations.forEach(activityLocation => promises.push(fetchDataForActivityLocation(activityLocation, forecastDays)));

    // wait until all promises are resolved and copy responses to array
    results = [...await Promise.all(promises)];

    console.log(results) // [data, someData, otherData...] 

    gettingData = true;
    activityHours = populateActivityHours(map, results, forecastDays);
    gettingData = false;

    //first draw
    resetData();
    //output.innerHTML = getTimeFromCurrentActivityHour(currentHour);
    drawIconsForActivityHour(currentHour);

    fetchMoreData = false;
  }

  var drawIconsForActivityHour = function(hour) {
    let activities = activityHours.get(hour);
    activities.forEach(activity => geoJSON.features.push(activity));
    drawIcons(geoJSON);
  }

  var drawIconsForActivities = function(activities) {
    let activitiesToRender = [...activities];
    let newGeoJSON = {
      type: "FeatureCollection",
      features: []
    };

    activitiesToRender.forEach(activity => {
      newGeoJSON.features.push(activity);
    });

    const featuresAdded = map.data.addGeoJson(newGeoJSON);
    
    map.data.forEach(mapFeature => {
      if (!featuresAdded.includes(mapFeature)) {
        map.data.remove(mapFeature);
      }
    })

  }

  // Add the markers to the map
  var drawIcons = function (geoJSON) {
     map.data.addGeoJson(geoJSON);
     // Set the flag to finished
     gettingData = false;
  };

    // Clear data layer and geoJSON
  var resetData = function () {
    geoJSON = {
      type: "FeatureCollection",
      features: []
    };
    map.data.forEach(function(feature) {
      map.data.remove(feature);
    });
    //results = [];
  };

  Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
  }

  google.maps.event.addDomListener(window, 'load', initialize);

  export { activityHours };
