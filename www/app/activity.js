import { getForecastLatLngDays, getSiteData } from './restify.js';

const assetsPath = "www/assets/";
var now = new Date();
const currentYear = now.getFullYear();

export async function fetchDataForActivityLocation(activityLocation, days) {
    const latLng = activityLocation["coordinates"];
    const lat = latLng[0];
    const lng = latLng[1];
    const site = activityLocation["site"];
    const resort = activityLocation["resort"];
    const checkWeather = activityLocation["checkWeather"];

    var siteUSGS = {};

    //fetch information based on presence of info config (site data, resort data, etc)
    if (site && Object.keys(site).length > 0) {
        siteUSGS = getSiteData(site);
    }

    // fetch information based on flags 
    var forecastData = checkWeather ? await getForecastLatLngDays(lat, lng, days) : {};

    var hydratedActivityLocation = {
        activityLocation: activityLocation,
        //forecast: await caches.open('super-cache').then(cache => cache.match(forecastRequest)),
        forecast: forecastData,
        siteData: await siteUSGS,
    };
    return hydratedActivityLocation;
}

export var populateActivityHours = function (map, hydratedActivityLocations, days) {
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
            let currentActivitiesForLocation = calculateActivities(map, hydratedActivityLocation, day, hourOfDay);
            currentActivitiesForLocation.forEach(activity => currentActivities.push(activity));
            activityHours.set(hour, currentActivities);
        })
    }
    return activityHours;
}

var calculateActivities = function (map, hydratedActivityLocation, day, hour) {
    var activities = [];
    var time = new Date();
    time.setTime(time.getTime() + ((hour + (day * 24))*60*60*1000));
    const checkWeather = hydratedActivityLocation.activityLocation.checkWeather;
    const coordinates = hydratedActivityLocation.activityLocation.coordinates;
    const possibleActivities = hydratedActivityLocation.activityLocation.activities;
    const forecastResponse = hydratedActivityLocation.forecast;

    possibleActivities.forEach(activity => {
        var validActivity = {};

        const startDateString = activity.startDate;
        const endDateString = activity.endDate;
        var infoIcon = assetsPath + activity.infoIcon;
        var activityWeather = activity.weather;

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

        // ------- START OF WEATHER BASED CHECKS ------- //

        if (checkWeather && activityWeather) {
            const forecastDay = forecastResponse.forecast.forecastday[day];
            const forecastHour = forecastDay.hour[hour];
            infoIcon = "http:" + forecastHour.condition.icon;

            const windDirection = forecastHour.wind_dir;
            const windSpeedMPH = forecastHour.wind_mph;
            const windGust = forecastHour.gust_mph;
            const pressure = forecastHour.pressure_mb;
            const temperature = forecastHour.temp_f;
            time = forecastHour.time;
            const moonPhase = forecastDay.astro.moon_phase;
            const humidity = forecastHour.humidity;
            const dayChanceOfSnow = forecastDay.day.daily_chance_of_snow;
            const dayChanceOfRain = forecastDay.day.daily_chance_of_rain;

            const tolerableWindDirections = activityWeather.windDirection;
            const minTempF = activityWeather.minTempF;
            const maxTempF = activityWeather.maxTempF;
            const minWindSpeed = activityWeather.minWindSpeed;
            const maxWindSpeed = activityWeather.maxWindSpeed;
            const minPressure = activityWeather.minPressure;
            const maxPressure = activityWeather.maxPressure;
            const minDayChanceOfSnow = activityWeather.minDayChanceOfSnow;
            const maxDayChanceOfSnow = activityWeather.maxDayChanceOfSnow;
            const minDayChanceOfRain = activityWeather.minDayChanceOfRain;
            const maxDayChanceOfRain = activityWeather.maxDayChanceOfRain;

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
                    infoIcon: infoIcon,
                    mapIcon: assetsPath + activity.mapIcon,
                    label: hydratedActivityLocation.activityLocation.name,
                    time: time,
                },
                geometry: {
                    type: "Point",
                    coordinates: [coordinates[1], coordinates[0]]
                }
            };
            // Set the custom marker icon
            map.data.setStyle(function (feature) {
                return {
                    icon: {
                        url: feature.getProperty('mapIcon'),
                        anchor: new google.maps.Point(10, 10),
                        size: new google.maps.Size(100, 100),
                        origin: new google.maps.Point(0, 0),
                        scaledSize: new google.maps.Size(32, 32)
                    }
                };
            });
            activities.push(feature);
        }
    });
    return mergeActivities(map, activities, hydratedActivityLocation, time);
}

var validateMonth = function (startMonth, endMonth) {
    return true;
}

var mergeActivities = function(map, activities, hydratedActivityLocation, time) {
    var activitySize = activities.length;
    const coordinates = hydratedActivityLocation.activityLocation.coordinates;
    var validActivity = {};
    var mergedActivities = [];

    if (activitySize <= 1) {
        return activities;
    }
    
    // multiple activities - merge them all into a single feature
    activities.forEach(activity => {
        Object.keys(activity.properties.activity).forEach(key => {
            if (key == "label") {
                validActivity[key] += " + " + activity.properties.activity[key];
            } else {
                validActivity[key] = activity.properties.activity[key];
            }
          });
    });

    var feature = {
        id: hydratedActivityLocation.activityLocation.name + validActivity.label,
        type: "Feature",
        properties: {
            activity: validActivity,
            infoIcon: assetsPath + activitySize + ".svg",
            mapIcon: assetsPath + activitySize + ".svg",
            label: hydratedActivityLocation.activityLocation.name,
            time: time,
        },
        geometry: {
            type: "Point",
            coordinates: [coordinates[1], coordinates[0]]
        }
    };
    // Set the custom marker icon
    map.data.setStyle(function (feature) {
        return {
            icon: {
                url: feature.getProperty('mapIcon'),
                anchor: new google.maps.Point(10, 10),
                size: new google.maps.Size(100, 100),
                origin: new google.maps.Point(0, 0),
                scaledSize: new google.maps.Size(32, 32)
            }
        };
    });
    mergedActivities.push(feature);
    return mergedActivities;
}
