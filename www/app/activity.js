import { getForecastLatLngDays, getSiteData } from './restify.js';

const assetsPath = "www/assets/";
var now = new Date();
const currentYear = now.getFullYear();
const numberOfDefaultActivityValues = 3; // label + time + isValid

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
    const siteData = hydratedActivityLocation.siteData;

    possibleActivities.forEach(activity => {
        // set default values
        var validActivity = {};
        validActivity.time = time;
        validActivity.label = activity.label;
        validActivity.isValid = false;

        const startDateString = activity.startDate;
        const endDateString = activity.endDate;
        var infoIcon = assetsPath + activity.infoIcon;
        var activityWeather = activity.weather;
        const activitySiteData = activity.siteData;

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

        // ------- START OF WEATHER-BASED CHECKS ------- //

        if (checkWeather &&  Object.keys(activityWeather).length > 0) {
            const forecastDay = forecastResponse.forecast.forecastday[day];
            const forecastHour = forecastDay.hour[hour];
            validActivity.time = forecastHour.time;
            infoIcon = "http:" + forecastHour.condition.icon;

            const windDirection = forecastHour.wind_dir;
            const windSpeedMPH = forecastHour.wind_mph;
            const windGust = forecastHour.gust_mph;
            const pressure = forecastHour.pressure_mb;
            const temperature = forecastHour.temp_f;
            const moonPhase = forecastDay.astro.moon_phase;
            const humidity = forecastHour.humidity;
            const dayChanceOfSnow = forecastDay.day.daily_chance_of_snow;
            const dayChanceOfRain = forecastDay.day.daily_chance_of_rain;
            const precipitationInches = forecastHour.precip_in;

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
            const minPrecipitation = activityWeather.minPrecipitation;
            const maxPrecipitation = activityWeather.maxPrecipitation;

            //TEMPERATURE (F)
            if (minTempF && maxTempF) {
                if (temperature >= minTempF && temperature <= maxTempF) {
                    validActivity.temperature = temperature + "&deg; F"
                    validActivity.isValid = true;
                } else validActivity.isValid = false;
            }

            //WIND (DIRECTION + SPEED)
            if (tolerableWindDirections && minWindSpeed && maxWindSpeed) {
                if (tolerableWindDirections.includes(windDirection) && windSpeedMPH >= minWindSpeed && windSpeedMPH <= maxWindSpeed) {
                    validActivity.wind = windDirection + " " + windSpeedMPH + " MPH";
                    validActivity.isValid = true;
                } else validActivity.isValid = false;
            }

            //PRESSURE
            if (minPressure && maxPressure) {
                if (pressure >= minPressure && pressure <= maxPressure) {
                    validActivity.pressure = pressure + " kPa";
                    validActivity.isValid = true;
                } else validActivity.isValid = false;
            }

            //PRECIPITATION
            if (minPrecipitation && maxPrecipitation) {
                if (precipitationInches >= minPrecipitation || precipitationInches >= maxPrecipitation) {
                    validActivity.minPrecipitation = precipitationInches + " in. precipitation";
                    validActivity.isValid = true;
                } else validActivity.isValid = false;
            }

            //DAILY CHANCE OF SNOW
            if (minDayChanceOfSnow && maxDayChanceOfSnow) {
                if (dayChanceOfSnow >= minDayChanceOfSnow && dayChanceOfSnow <= maxDayChanceOfSnow) {
                    validActivity.dayChanceOfSnow = dayChanceOfSnow + "% chance of snow";
                    validActivity.isValid = true;
                } else validActivity.isValid = false;
            }

            //DAILY CHANCE OF RAIN
            if (minDayChanceOfRain && maxDayChanceOfRain) {
                if (dayChanceOfRain >= minDayChanceOfRain && dayChanceOfRain <= maxDayChanceOfRain) {
                    validActivity.dayChanceOfRain = dayChanceOfRain + "% chance of rain";
                    validActivity.isValid = true;
                } else validActivity.isValid = false;
            }

        }

        // ------- START OF SITE-BASED CHECKS ------- //
        if (siteData && Object.keys(siteData).length > 0 && activitySiteData && Object.keys(activitySiteData).length > 0) {
            // TEMPORARY -- GET FIRST TIME SERIES AND ADD ALL VALUES TO VALID ACTIVITY
            const timeSeries = siteData.value.timeSeries;
            timeSeries.forEach(ts => {
                for(let i = 0; i < activitySiteData.length; i++) {
                    const code = activitySiteData[i].code;
                    const min = activitySiteData[i].min;
                    const max = activitySiteData[i].max;
                    const value = ts.values[i].value[0].value;
                    const unit = ts.variable.unit.unitCode;
                    
                    if (ts.variable.variableCode[i].value == code && value >= min && value <= max) {
                        validActivity[ts.name] = value + unit;
                        validActivity.isValid = true;
                    } else {
                        validActivity.isValid = false;
                    }
                }
            });
        }

        // ADD TO RESULTS
        if (validActivity && validActivity.isValid && Object.keys(validActivity).length >= numberOfDefaultActivityValues) {
            //scrub isValid from activity
            delete validActivity.isValid;

            var feature = {
                id: hydratedActivityLocation.activityLocation.name + validActivity.label,
                type: "Feature",
                properties: {
                    activity: validActivity,
                    infoIcon: infoIcon,
                    mapIcon: assetsPath + activity.mapIcon,
                    label: hydratedActivityLocation.activityLocation.name,
                    time: validActivity.time,
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

    //set top-level values 
    validActivity[time] = time;
    
    // multiple activities - merge them all into a single feature
    activities.forEach(activity => {
        validActivity[activity.properties.activity.label] = '\n' + activity.properties.activity.label;
        Object.keys(activity.properties.activity).forEach(key => {
            if (key == "label" || key == "time") {
                return;
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
