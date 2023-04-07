import { updateSliderValue, } from '../app/app.js';
let slider = document.getElementById('slider');
let now = new Date();
let startValue = now.getHours();
var nextVal = startValue;

noUiSlider.create(slider, {
    start: startValue,
    connect: [true, false],
    range: {
        'min': 0,
        'max': 71
    },
    step: 1,
    pips: {
        mode: 'steps',
        density: 12
    },
    //format: formatForSlider,
    tooltips: {
        to: function() {
            var currentDate = new Date();
            currentDate.setTime(currentDate.getTime() + ((nextVal-startValue)*60*60*1000));
            return currentDate.toLocaleString();
        }
    }
});

slider.noUiSlider.on('update', function (values, handle, unencoded, isTap, positions) {
    var value = values[handle];
    let roundedValue = Math.round(+value).toFixed(0);
    updateSliderValue(+value)
    nextVal = roundedValue;
});
