var rand = Math.random

var fishy, popbar
var paramList = [ { name: 'popSize', value: 100, label: 'Population size' },
                  { name: 'genotypes', value: 200, label: '#Genotypes' },
                  { name: 'mutProb', value: .005, label: 'P(mutation)' },
                  { name: 'gensPerSec', value: 100, label: 'Generations/sec' } ]
var params = {}
paramList.forEach ((p) => { params[p.name] = p })
window.onload = () => {
  fishy = $('.fishy')
  var paramContainer = $('<div class="params">')
  fishy.append (popbar = $('<div class="popbar">'),
                paramContainer,
                $('<a href="https://github.com/ihh/right-fishy">').text('Source'))
  paramList.forEach ((param) => {
    paramContainer.append ($('<div class="param">')
                           .append ($('<div class="label">').text (param.label),
                                    param.input = $('<input type="number">').val (param.value)))
    var updateValue = () => {
      param.value = parseFloat (param.input.val())
      update()
    };
    param.input.keyup (updateValue)
    param.input.click (updateValue)
  })
  update()
}

// http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
  
  return [r * 255, g * 255, b * 255].map (Math.floor);
}
var rgbToHex = (rgb) => rgb.reduce ((hex, n) => hex + (n < 16 ? '0' : '') + n.toString(16), '');

var sum = (counts) => counts.reduce ((t, c) => t + c, 0)

var fillPopBar = (popbar, counts) => {
  var popSize = sum (counts)
  var totalGenotypes = counts.length
  popbar.empty()
  counts.forEach ((count, genotype) => {
    var hue = totalGenotypes ? (genotype / totalGenotypes) : 0
    popbar.append ($('<div class="bar">')
                   .css ('width', (100 * count / popSize).toFixed(5) + '%')
                   .css ('background-color', '#' + rgbToHex (hsvToRgb (hue, 1, 1))))
  })
}

var updateCounts = (counts) => {
  var genotypes = params.genotypes.value
  var newPopSize = params.popSize.value
  var mutProb = params.mutProb.value
  if (counts.length > genotypes)  
    counts.splice (genotypes, counts.length - genotypes)
  else
    counts.push.apply (counts, new Array (genotypes - counts.length).fill(0))
  var oldPop = counts.reduce ((pop, genpop, g) => pop.concat (new Array(genpop).fill(g)),
                              [])
  var oldPopSize = oldPop.length
  for (var i = 0; i < genotypes; ++i)
    counts[i] = 0
  for (var n = 0; n < newPopSize; ++n) {
    if (rand() < mutProb)
      ++counts[Math.floor (rand() * genotypes)]
    else if (oldPopSize)
      ++counts[oldPop[Math.floor (rand() * oldPopSize)]]
    else if (genotypes)
      ++counts[0]
  }
}

var counts = [], generation = 0
var timer
var update = () => {
  ++generation
  updateCounts (counts)
  fillPopBar (popbar, counts)
  var delay = params.gensPerSec.value > 0 ? Math.ceil (1000 / params.gensPerSec.value) : 1
  if (timer)
    window.clearTimeout (timer)
  timer = window.setTimeout (update, delay)
}

