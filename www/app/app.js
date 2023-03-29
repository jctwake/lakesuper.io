//import activityLocationData from '../resources/location_to_activity.json' assert {type: 'json'};
import activityLocationData from '../resources/location_to_activity.json' assert {type: 'json'};

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
  const currentYear = now.getFullYear();

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
      var contentString = "<img src=" + event.feature.getProperty("weatherIcon") + ">"
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
    activityLocations.forEach(activityLocation => promises.push(fetchDataForActivityLocation(activityLocation)));

    // wait until all promises are resolved and copy responses to array
    results = [...await Promise.all(promises)];

    console.log(results) // [data, someData, otherData...] 

    activityHours = populateActivityHours(results, forecastDays);

    //first draw
    resetData();
    //output.innerHTML = getTimeFromCurrentActivityHour(currentHour);
    drawIconsForActivityHour(currentHour);

    fetchMoreData = false;
  }

  async function fetchDataForActivityLocation(activityLocation) {
    const latLng = activityLocation["coordinates"];
    const lat = latLng[0];
    const lng = latLng[1];
    const startMonth = activityLocation["startMonth"];
    const endMonth = activityLocation["endMonth"];
    const site = activityLocation["site"];

    var weather = {};
    var days = 3;
    var isValidMonth = true;
    var siteUSGS = {};

    if (startMonth && endMonth) {
      isValidMonth = validateMonth(startMonth, endMonth);
    }

    if (!isValidMonth) {
      return {};
    }

    if (site && Object.keys(site).length > 0) {
      siteUSGS = getSiteData(site);
    }

    //const forecastRequest = generateRequestForecastLatLngDays(lat,lng,days);
    //caches.open('super-cache').then(cache => cache.add(forecastRequest));

    var hydratedActivityLocation = {
      activityLocation: activityLocation,
      //forecast: await caches.open('super-cache').then(cache => cache.match(forecastRequest)),
      forecast: await getForecastLatLngDays(lat, lng, days),
      siteData: await siteUSGS,
    };
    return hydratedActivityLocation; 
  }

  var populateActivityHours = function(hydratedActivityLocations, days) {
    var activityHours = new Map();

    // for each hour
    const hours = days * 24;
    for (let hour = 0; hour < hours; hour++) {
      let day = Math.floor(hour / 24);
      let hourOfDay = hour % 24;
      hydratedActivityLocations.forEach(hydratedActivityLocation => {
        if (!activityHours.has(hour)) {
          activityHours.set(hour, []);
        }
        let currentActivities = activityHours.get(hour);
        let currentActivitiesForLocation = calculateActivities(hydratedActivityLocation, day, hourOfDay);
        currentActivitiesForLocation.forEach(activity => currentActivities.push(activity));
        activityHours.set(hour, currentActivities);
      })
    }
    return activityHours;
  }

  var validateMonth = function(startMonth, endMonth) {
    return true;
  }

  var getForecastLatLngDays = function(lat, lng, days) {
    gettingData = true;
    const options = {
	    method: 'GET',
	    headers: {
		    'X-RapidAPI-Key': 'c88928e0b5msh75ea338c74903d0p172c80jsn23fe4a426f9a',
		    'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com'
	    }
    };

    var url = "https://weatherapi-com.p.rapidapi.com/forecast.json?q="
    var requestString = url + lat + "," + lng + "&days=" + days;
    return fetch(requestString, options).then(res=> res.clone().json());
  }

  var generateRequestForecastLatLngDays = function(lat, lng, days) {
    gettingData = true;
    const options = {
	    method: 'GET',
	    headers: {
		    'X-RapidAPI-Key': 'c88928e0b5msh75ea338c74903d0p172c80jsn23fe4a426f9a',
		    'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com'
	    }
    };

    var url = "https://weatherapi-com.p.rapidapi.com/forecast.json?q="
    var requestString = url + lat + "," + lng + "&days=" + days;
    return new Request(requestString, options);
  }

  var getSiteData = function(site) {
    gettingData = true;
    const siteId = site["id"];
    const parameterCd = site["parameterCodes"];
    var requestString = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=" + siteId +
    "&parameterCd=" + parameterCd + "&siteType=ST&siteStatus=all";
    return fetch(requestString).then(res=>res.clone().json());
  }

  var generateRequestSiteData = function(site) {
    gettingData = true;
    const siteId = site["id"];
    const parameterCd = site["parameterCodes"];
    var requestString = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=" + siteId +
    "&parameterCd=" + parameterCd + "&siteType=ST&siteStatus=all";
    return new Request(requestString);
  }

  var calculateActivities = function(hydratedActivityLocation, day, hour) {
    var activities = [];
    const coordinates = hydratedActivityLocation.activityLocation.coordinates;
    const possibleActivities = hydratedActivityLocation.activityLocation.activities;
    const forecastResponse = hydratedActivityLocation.forecast;
    const forecastDay = forecastResponse.forecast.forecastday[day];
    const forecastHour = forecastDay.hour[hour];

    const windDirection = forecastHour.wind_dir;
    const windSpeedMPH = forecastHour.wind_mph;
    const windGust = forecastHour.gust_mph;
    const pressure = forecastHour.pressure_mb;
    const temperature = forecastHour.temp_f;
    const time = forecastHour.time;
    const moonPhase = forecastDay.astro.moon_phase;
    const humidity = forecastHour.humidity;
    const dayChanceOfSnow = forecastDay.day.daily_chance_of_snow;
    const dayChanceOfRain = forecastDay.day.daily_chance_of_rain;

    possibleActivities.forEach(activity => {
      var validActivity = {};
      // FOR EACH POSSIBLE WEATHER DETAIL
      // SEE IF WEATHER PASSES ACTIVITY THRESHOLD
      const startDateString = activity.startDate;
      const endDateString = activity.endDate;
      const tolerableWindDirections = activity.weather.windDirection
      const minTempF = activity.weather.minTempF;
      const maxTempF = activity.weather.maxTempF;
      const minWindSpeed = activity.weather.minWindSpeed;
      const maxWindSpeed = activity.weather.maxWindSpeed;
      const minPressure = activity.weather.minPressure;
      const maxPressure = activity.weather.maxPressure;
      const minDayChanceOfSnow = activity.weather.minDayChanceOfSnow;
      const maxDayChanceOfSnow = activity.weather.maxDayChanceOfSnow;
      const minDayChanceOfRain = activity.weather.minDayChanceOfRain;
      const maxDayChanceOfRain = activity.weather.maxDayChanceOfRain;

      // DATES
      if (startDateString && endDateString) {
        const startDate = new Date(currentYear + "-" + startDateString);
        const endDate = new Date(currentYear + "-" + endDateString);
        var nowRelativeToActivity = new Date(now);
        nowRelativeToActivity.setDate(nowRelativeToActivity.getDate() + day);
        if (nowRelativeToActivity < startDate || nowRelativeToActivity > endDate) {
          return {};
        } else {
          validActivity.timeframe = startDate.toISOString + " - " + endDate.toISOString;
        }
      }

      //TEMPERATURE (F)
      if (minTempF && maxTempF) {
        if (temperature < minTempF || temperature > maxTempF) {
          return {};
        } else {
          validActivity.temperature = temperature + "&deg; F"
        }
      }

      //WIND DIRECTION
      if (tolerableWindDirections) {
        if (!tolerableWindDirections.includes(windDirection)) {
          return {};
        } else {
          validActivity.wind = windDirection;
        }
      }

      //WIND SPEED
      if (minWindSpeed && maxWindSpeed) {
        if (windSpeedMPH < minWindSpeed || windSpeedMPH > maxWindSpeed) {
          return {};
        } else {
          validActivity.wind += windSpeedMPH + " MPH";
        }
      }

      //PRESSURE
      if (minPressure && maxPressure) {
        if (pressure < minPressure || pressure > maxPressure) {
          return {};
        } else {
          validActivity.pressure = pressure + " kPa";
        }
      }

      //DAILY CHANCE OF SNOW
      if (minDayChanceOfSnow && maxDayChanceOfSnow) {
        if (dayChanceOfSnow < minDayChanceOfSnow || dayChanceOfSnow > maxDayChanceOfSnow) {
          return {};
        } else {
          validActivity.dayChanceOfSnow = dayChanceOfSnow + "% chance of snow";
        }
      }

      //DAILY CHANCE OF RAIN
      if (minDayChanceOfRain && maxDayChanceOfRain) {
        if (dayChanceOfRain < minDayChanceOfRain || dayChanceOfRain > maxDayChanceOfRain) {
          return {};
        } else {
          validActivity.dayChanceOfRain = dayChanceOfRain + "% chance of rain";
        }
      }

      // ADD TO RESULT
      if (activity => activity && Object.keys(activity).length > 0) {
        validActivity.label = activity.label;
        validActivity.time = time;
        var feature = {
          id: hydratedActivityLocation.activityLocation.name + validActivity.label,
          type: "Feature",
          properties: {
            activity: validActivity,
            weatherIcon: "http:" + forecastHour.condition.icon,
            activityIcon: "www/assets/" + activity.icon,
            label: hydratedActivityLocation.activityLocation.name,
            time: time,
          },
          geometry: {
            type: "Point",
            coordinates: [coordinates[1], coordinates[0]]
          }
        };
        // Set the custom marker icon
        map.data.setStyle(function(feature) {

          return {
            icon : {
              url: feature.getProperty('activityIcon'),
              anchor: new google.maps.Point(10, 10),
              size: new google.maps.Size(100,100),
              origin: new google.maps.Point(0, 0),
              scaledSize: new google.maps.Size(32, 32)
            }
          };
        });
        activities.push(feature);
      }
    });

    return activities;
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
