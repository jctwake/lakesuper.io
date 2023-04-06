export var initializeMap = function(map) {
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