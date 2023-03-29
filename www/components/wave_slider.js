import { updateSliderValue } from '../app/app.js';
const svgns = "http://www.w3.org/2000/svg";
const svg = document.querySelector("svg");
const timeSlider = document.getElementById("timeSlider");
const hourLabel = document.getElementById("hour-label");
const slider = document.getElementById("slider");

let positions = 72; // how many numbers
let numTicks = 6; // how many ticks
let spacing = 12; // space between lines
let jump = 45; // height of number jump during animation
let dur = 1.1; // master duration
let count = 0; // simple counter for the numbers
let startX = 60; // first line position and first number position
let startXRef = 30; //change this one as well ...
let dragMin = startX;
let y2Pos = 60; // bottom of each tick line
let y1Pos;
let numberLineHeightOffset = 25;
let tickLineHeightOffset = 15;
let masterStagger = 5; // higher numbers tighten the curve
let lastValue;
let lastX;

// move the draggable element into position
gsap.set("#slider", { x: startX, xPercent: -50, y: y2Pos + 20 });

// make a 5 pack of lines for each number
for (let j = 0; j < positions; j = j + numTicks) {
  makeNumber(j);
  for (let i = 0; i < numTicks; i++) {
    y1Pos = i === 0 ? y2Pos - numberLineHeightOffset : y2Pos - tickLineHeightOffset; // first line in each pack is slightly taller
    makeLine(y1Pos);
    startX += spacing;
  }
  count++;
}

makeNumber(positions); // need one final number 
makeLine(y2Pos - numberLineHeightOffset); //  need 1 extra line for the last number

// creates the line elements
function makeLine(yp) {
  let newLine = document.createElementNS(svgns, "line");
  svg.appendChild(newLine);
  gsap.set(newLine, {
    attr: { x1: startX, x2: startX, y1: yp, y2: y2Pos }
  });
}

// creates the numbers
function makeNumber(number) {
  let txt = document.createElementNS(svgns, "text");
  svg.appendChild(txt);
  txt.textContent = number;
  gsap.set(txt, {
    attr: { x: startX, y: y2Pos - 40, "text-anchor": "middle" }
  });
}

// final position of last line is new draggable max
let dragMax = startX;

// main timeline for the number jump
let animNumbers = gsap.timeline({ paused: true });
animNumbers
  .to("text", {
    duration: dur,
    y: -jump,
    scale: 1.5,
    fill: "#9bc1f8",
    stagger: {
      amount: masterStagger,
      yoyo: true,
      repeat: 1
    },
    ease: "sine.inOut"
  })
  .time(dur); // set the time to the end of the first number jump



// Map the drag range to the timeline duration
let mapper = gsap.utils.mapRange(
  dragMin,
  dragMax,
  dur,
  animNumbers.duration() - dur
);

// Create the draggable element and set the range 
Draggable.create("#slider", {
  type: "x",
  bounds: {
    minX: dragMin,
    maxX: dragMax
  },
  edgeResistance: 1,
  onDrag: updateMeter,
});

// using the mapper, update the current time of the timeline
function updateMeter() {
  gsap.set(animNumbers, { time: mapper(this.x) });
  var convertedValue = Math.floor((this.x - startXRef) / (spacing));
  if (convertedValue === positions) {
    convertedValue = convertedValue - 1;
  }
  if (convertedValue != lastValue) {
    updateSliderValue(convertedValue);
    lastValue = convertedValue;
  }
}
