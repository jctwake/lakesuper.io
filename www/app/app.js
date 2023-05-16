//import activityLocationData from '../resources/location_to_activity.json' assert {type: 'json'};
import activityLocationData from '../resources/location_to_activity.json' assert {type: 'json'};
import { fetchDataForActivityLocation, populateActivityHours } from './activity.js';
import { getForecastLatLngDays } from './restify.js';

const superCache = await caches.open('super-cache');
  var map;
  var geoJSON;
  var request;
  let results = [];
  var gettingData = false;
  var fetchMoreData = true;
  var activityHours = new Map();
  var activityList = document.getElementById("activity-list")
  var boundForecast = {};
  var now = new Date();
  const forecastDays = 3;
  const currentHour = now.getHours()
  const startLat = 47.3;
  const startLng = -91.7;

  function initialize() {
    var mapOptions = {
      zoom: 9,
      center: new google.maps.LatLng(startLat,startLng)
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
    var hourValue = Math.round(value);
    if (activityHourIsValid(hourValue)) {
      drawIconsForActivityHour(hourValue);
      //drawIconsForActivities(activityHours.get(hourValue));
    }
    updateBoundInfo(hourValue);
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
      getDataForMapBounds();
    }
  };


  async function getActivityDataFromJSON() {
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
    drawIconsForActivityHour(currentHour);
    updateBoundInfo(currentHour);

    fetchMoreData = false;
  }

  async function getDataForMapBounds(days) {
    const promises = [];
    var results = [];
    var bounds = map.getBounds();
    var NE = bounds.getNorthEast();
    var SW = bounds.getSouthWest();

    // fire all requests
    promises.push(getForecastLatLngDays(startLat, startLng, forecastDays));

    // wait until all promises are resolved and copy responses to array
    results = [...await Promise.all(promises)];

    boundForecast = results[0];
  }

  var drawIconsForActivityHour = function(hour) {
    let activities = activityHours.get(hour);
    activities.forEach(activity => geoJSON.features.push(activity));
    updateActivityList(activities);
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
  };

  // Add the markers to the map
  var drawIcons = function (geoJSON) {
     map.data.addGeoJson(geoJSON);
     // Set the flag to finished
     gettingData = false;
  };

  var updateBoundInfo = function(hourValue) {
    const boundInfoLabel = document.getElementById('bound-info-label');
    const boundInfoImage = document.getElementById('bound-info-image');

    var hour = hourValue % 24;
    var day = Math.floor(hourValue / 24);
    if (Object.keys(boundForecast).length > 0) {
      var forecastDayHour = boundForecast.forecast.forecastday[day].hour[hour];
      var forecastTime = forecastDayHour.time;
      var forecastCondition = forecastDayHour.condition.text;
      var temperatureString = forecastDayHour.temp_f + "F";
      var windString = forecastDayHour.wind_dir + " " + forecastDayHour.wind_mph + "mph";
      var uvString = forecastDayHour.uv + "UV index";
      var chanceOfRainString = forecastDayHour.chance_of_rain + "% chance of rain";
      var changeOfSnowString = forecastDayHour.chance_of_snow + "% chance of snow";

      boundInfoLabel.innerText = forecastTime + "\n" + forecastCondition + "\n" 
      + temperatureString + "\n" + windString + "\n" + uvString;
      boundInfoImage.src = forecastDayHour.condition.icon;
    }
  }

  var updateActivityList = function(activities) {
    activityList.replaceChildren();
    activities.forEach(activity => {
      var li = document.createElement('li');
      li.onclick = function(){   
        map.setCenter(new  google.maps.LatLng(+activity.geometry.coordinates[1], +activity.geometry.coordinates[0]));
      };
      var img = document.createElement('img');
      img.src = activity.properties.mapIcon;
      li.appendChild(img);
      li.appendChild(document.createTextNode(activity.id));
      activityList.appendChild(li);
    })
  }

  var selectActivityFromList = function(activity) {

  }

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
