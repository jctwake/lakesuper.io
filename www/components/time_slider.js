import { updateSliderValue, activityHours } from '../app/app.js';
let slider = document.getElementById('slider');
let now = new Date();
let startValue = now.getHours();
var nextVal = startValue;
//let background = document.qerySelector('.slider-top');

noUiSlider.create(slider, {
    start: [12],
    connect: [true, false],
    range: {
        'min': 0,
        'max': 71
    },
    step: 1,
    format: {
      from: function(value) {
            let roundedValue = Math.round(+value).toFixed(0);
            return roundedValue;
        },
      to: function(value) {
            let roundedValue = Math.round(+value).toFixed(0);
            updateSliderValue(+value)
            nextVal = roundedValue;
            return roundedValue;
        }
    },
    tooltips: {
        to: function() {
            var currentDate = new Date();
            currentDate.setTime(currentDate.getTime() + ((nextVal-startValue)*60*60*1000));
            return currentDate.toLocaleString();
        }
    }
});

function getTime(hour) {
    let activities = activityHours.get(hour);
    let activity = activities[0];
    let result = activity.properties["time"] ? activity.properties["time"] :  new Date();
    return result;
}

// function color(classBlock, text, color, proportions) {
//   background.className = classBlock;
// }

// slider.noUiSlider.on('update', function (values, handle) {
//     inputs[handle].value = values[handle];
// })

// slider.noUiSlider.on('update', function (values, handle) {
//     value.innerHTML = values[handle];
//     let result = (values[handle] < 149999) ? color('c-50', 118, '#A37A60', values[handle]) :
//                  (values[handle] < 249999) ? color('c-150', 120, '#96A6B9', values[handle]) :
//                  (values[handle] < 499999) ? color('c-250', 122, '#DFBA4B', values[handle]) :
//                  (values[handle] == 500000) ? color('c-500', 125, '#6B9FE0', values[handle]) : ''
// });