var now = new Date();
const currentYear = now.getFullYear();

export var calculateActivities = function(map, hydratedActivityLocation, day, hour) {
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
          validActivity.timeframe = startDate.toLocaleString() + " - " + endDate.toLocaleString();
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