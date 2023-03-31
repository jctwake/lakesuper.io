export var getForecastLatLngDays = function(lat, lng, days) {
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

  export var generateRequestForecastLatLngDays = function(lat, lng, days) {
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

 export var getSiteData = function(site) {
    const siteId = site["id"];
    const parameterCd = site["parameterCodes"];
    var requestString = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=" + siteId +
    "&parameterCd=" + parameterCd + "&siteType=ST&siteStatus=all";
    return fetch(requestString).then(res=>res.clone().json());
  }

  var generateRequestSiteData = function(site) {
    const siteId = site["id"];
    const parameterCd = site["parameterCodes"];
    var requestString = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=" + siteId +
    "&parameterCd=" + parameterCd + "&siteType=ST&siteStatus=all";
    return new Request(requestString);
  }