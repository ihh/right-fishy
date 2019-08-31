var rand = Math.random

var fishy, bubbles, popbar
var paramList = [ { name: 'popSize', value: 100, label: 'Population size' },
                  { name: 'genotypes', value: 200, label: '#Genotypes' },
                  { name: 'mutProb', value: .005, label: 'P(mutation)' },
                  { name: 'gensPerSec', value: 100, label: 'Generations/sec' } ]
var params = {}
paramList.forEach ((p) => { params[p.name] = p })
window.onload = () => {
  fishy = $('.fishy')
  bubbles = $('.bubbles')
  var paramContainer = $('<div class="params">')
  fishy.append (bubbles = $('<div class="bubbles">'),
                popbar = $('<div class="popbar">'),
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

var fillPopBar = (popbar, counts, hues) => {
  var popSize = sum (counts)
  popbar.empty()
  counts.forEach ((count, genotype) => {
    popbar.append ($('<div class="bar">')
                   .css ('width', (100 * count / popSize).toFixed(5) + '%')
                   .css ('background-color', hues[genotype]))
  })
}

var fillBubbles = (container, counts, hues) => {
  var diameter = container.width()
  var sortedGenotype = counts.map ((c,n) => n).sort ((a,b) => counts[b] - counts[a])
  // adapted from https://bl.ocks.org/alokkshukla/3d6be4be0ef9f6977ec6718b2916d168
  var d3color = d3.scaleOrdinal(hues);
  var dataset = { children: sortedGenotype.map ((g) => ({ Count: counts[g] })) }
  var bubble = d3.pack(dataset)
      .size([diameter, diameter])
      .padding(1.5);
  bubbles.empty()
  var svg = d3.select(container.get(0))
      .append("svg")
      .attr("width", diameter)
      .attr("height", diameter)
      .attr("class", "bubble");
  var nodes = d3.hierarchy(dataset)
      .sum(function(d) { return d.Count; });

  var node = svg.selectAll(".node")
      .data(bubble(nodes).descendants())
      .enter()
      .filter(function(d){
        return  !d.children
      })
      .append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

  node.append("circle")
    .attr("r", function(d) {
      return d.r;
    })
    .style("fill", function(d,i) {
      return hues[sortedGenotype[i]];
    });
}

var resizeArray = (array, newSize, defaultVal) => {
  if (array.length > newSize)
    array.splice (newSize, array.length - newSize)
  else
    array.push.apply (array, new Array (newSize - array.length))
}

var updateCounts = (counts, pop, parent) => {
  var genotypes = params.genotypes.value
  var mutProb = params.mutProb.value
  var newPopSize = params.popSize.value
  var oldPopSize = pop.length
  var oldPop = pop.slice(0)
  resizeArray (counts, genotypes)
  counts.fill(0)
  resizeArray (pop, newPopSize)
  resizeArray (parent, newPopSize)
  parent.forEach ((_dummy, n) => {
    parent[n] = ((!oldPopSize || rand() < mutProb)
                 ? undefined  // signifies mutation
                 : Math.floor (rand() * oldPopSize))
  })
  parent.forEach ((p, n) => {
    var type = (typeof(p) === 'undefined'
                ? Math.floor (rand() * genotypes)
                : oldPop[p] % genotypes)
    pop[n] = type
    ++counts[type]
  })
}

var getHues = (counts) => {
  var totalGenotypes = counts.length
  return counts.map ((count, genotype) => '#' + rgbToHex (hsvToRgb (totalGenotypes ? (genotype / totalGenotypes) : 0, 1, 1)))
}

var pop = [0], counts = [], parent = [], generation = 0
var timer
var update = () => {
  ++generation
  updateCounts (counts, pop, parent)
  var hues = getHues (counts)
  fillPopBar (popbar, counts, hues)
  fillBubbles (bubbles, counts, hues)
  var delay = params.gensPerSec.value > 0 ? Math.ceil (1000 / params.gensPerSec.value) : 1
  if (timer)
    window.clearTimeout (timer)
  timer = window.setTimeout (update, delay)
}

