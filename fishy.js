var rand = Math.random

var fishy, mainland, islands = [], islandsContainer
var paramList = [ { name: 'popSize', value: 10000, label: 'Population size' },
                  { name: 'genotypes', value: 200, label: '#Alleles' },
                  { name: 'mutProb', value: .0002, label: 'P(mutation)' },
                  { name: 'gensPerSec', value: 1000, label: 'Generations/sec' },
                  { name: 'islands', value: 4, label: '#Islands', update: rebuildIslands },
                  { name: 'islandPopSize', value: 100, label: 'Island pop. size' },
                  { name: 'migProb', value: .005, label: 'P(migration)' } ]
var params = {}
paramList.forEach ((p) => { params[p.name] = p })
window.onload = () => {
  fishy = $('.fishy')
  var paramContainer = $('<div class="params">')
  mainland = makeDeme ('mainland', 'Mainland', [0])
  fishy.append ($('<div class="simulation">')
                .append ($('<div class="main">')
                         .append (mainland.container,
                                  paramContainer),
                         islandsContainer = $('<div class="islands">')),
                $('<a href="https://github.com/ihh/right-fishy">').text('Source'))
  paramList.forEach ((param) => {
    var urlParam = getUrlParameter (param.name)
    var paramValue = urlParam.length ? parseFloat(urlParam) : param.value
    paramContainer.append ($('<div class="param">')
                           .append ($('<div class="label">').text (param.label),
                                    param.input = $('<input type="number">').val (paramValue)))
    var updateValue = () => {
      param.value = parseFloat (param.input.val())
      if (param.update)
        param.update()
      update()
    };
    param.input.keyup (updateValue)
    param.input.click (updateValue)
  })
  rebuildIslands()
  update()
}

var makeDeme = (className, title, initPop) => {
  var bubbles, popbar
  var titleSpan = $('<span class="title">')
  var deme = { pop: initPop || [],
               parent: [],
               title }
  deme.container = $('<div class="deme">')
    .addClass (className)
    .append (titleSpan
             .text (title)
             .click (() => {
               deme.paused = !deme.paused
               titleSpan.text (deme.title + (deme.paused ? ' (Paused)' : ''))
             }),
             deme.bubbles = $('<div class="bubbles">'),
	     deme.popbarContainer = $('<div class="popbar">')
             .append (deme.popbar = $('<canvas>')))
  return deme
}

function rebuildIslands() {
  islands = []
  islandsContainer.empty()
  for (var i = 0; i < params.islands.value; ++i) {
    var island = makeDeme ('island', 'Island #' + (i+1))
    islands.push (island)
    islandsContainer.append (island.container)
  }
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

var fillPopBar = (canvas, counts, colors, hues) => {
  var popSize = sum (counts)
  var container = canvas.parent()
  var width = container.width(), height = container.height()
  canvas.attr ('width', width)
  canvas.attr ('height', height)
  var context = canvas.get(0).getContext('2d')
  var x = 0
  counts
    .map ((_c, n) => n)
    .sort ((a, b) => hues[a] - hues[b])
    .forEach ((genotype) => {
      var count = counts[genotype]
      if (count > 0) {
	var w = width * count / popSize
	context.fillStyle = colors[genotype]
	context.fillRect (x, 0, w, height)
	x += w
      }
    })
}

var fillBubbles = (bubbles, counts, colors) => {
  var diameter = bubbles.width()
  var sortedGenotype = counts.map ((c,n) => n).sort ((a,b) => counts[b] - counts[a])
  // adapted from https://bl.ocks.org/alokkshukla/3d6be4be0ef9f6977ec6718b2916d168
  var d3color = d3.scaleOrdinal(colors);
  var dataset = { children: sortedGenotype.map ((g) => ({ Count: counts[g] })) }
  var bubble = d3.pack(dataset)
      .size([diameter, diameter])
      .padding(1.5);
  bubbles.empty()
  var svg = d3.select(bubbles.get(0))
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
      return colors[sortedGenotype[i]];
    });
}

var resizeArray = (array, newSize, defaultVal) => {
  if (array.length > newSize)
    array.splice (newSize, array.length - newSize)
  else
    array.push.apply (array, new Array (newSize - array.length))
}

var updateDeme = (deme, newPopSize, mutProb, newMutant, time) => {
  if (!deme.paused) {
    var pop = deme.pop
    var genotypes = params.genotypes.value || 1
    var oldPopSize = pop.length
    var oldPop = pop.slice(0)
    resizeArray (pop, newPopSize)
    var coalChildren = new Array(oldPopSize).fill(null)
    var newParent = pop.map ((_dummy, n) => {
      if (!oldPopSize || rand() < mutProb) {
        return null  // signifies mutation
      } else {
        var p = Math.floor (rand() * oldPopSize)
        var cc = coalChildren[p]
        if (cc === null || typeof(cc) === 'undefined')
          coalChildren[p] = n
        else if (typeof(cc) === 'number')  // first coalescence
          coalChildren[p] = [cc, n]
        else
          cc.push (n)
        return p
      }
    })
    newParent.forEach ((p, n) => {
      var type = (p === null
                  ? newMutant()
                  : (oldPop[p] % genotypes))
      pop[n] = type
    })

    // log
    var lastCoalHistory = deme.coalHistory || null
    var coalEvents = [], coalByParent = {}
    deme.coalHistory = newParent.map ((p, n) => {
      if (p === null)
        return { time,
                 isMutation: true }
      var cc = coalChildren[p]
      var parentEvent = lastCoalHistory && lastCoalHistory[p]
      if (typeof(cc) === 'number') {  // no coalescence this generation
        coalByParent[p] = parentEvent
        return parentEvent
      } else {
        if (!coalByParent[p]) {  // only create coalescence object once; use parent as key
          var newEvent = { time,
                           isCoalescence: true,
                           lineages: cc.length,
                           activeLineages: cc.length,
                           parent: parentEvent }
          coalByParent[p] = newEvent
        }
        return coalByParent[p]
      }
    })
    if (lastCoalHistory)
      lastCoalHistory.forEach ((parentEvent, p) => {
        if (!coalByParent[p])  // node p in the previous generation had no children; deplete the active lineage count
          while (parentEvent && parentEvent.isCoalescence) {
            var active = --parentEvent.activeLineages
            if (active)
              break
            parentEvent = parentEvent.parent
          }
      })
  }
}

var log2 = Math.log(2)
var getHues = (totalGenotypes) => {
  var bits = Math.ceil (Math.log(totalGenotypes) / log2), norm = 2 << bits
  return new Array (totalGenotypes).fill(0).map ((_c, genotype) => {
    var hue = 0
    for (var b = 0; b < bits; ++b, hue <<= 1, genotype >>= 1)
      hue |= genotype & 1
    return hue / norm
  })
}
var huesToColors = (hues) => hues.map ((hue) => '#' + rgbToHex (hsvToRgb (hue, 1, 1)))

var redrawDeme = (deme, colors, hues) => {
  var genotypes = params.genotypes.value || 1
  var counts = new Array(genotypes).fill(0)
  deme.pop.forEach ((type) => ++counts[type])
  fillPopBar (deme.popbar, counts, colors, hues)
  fillBubbles (deme.bubbles, counts, colors)
}

var generation = 0
var timer
var update = () => {
  var genotypes = params.genotypes.value || 1
  var gensPerSec = params.gensPerSec.value
  for (var iter = 0; iter < Math.ceil (gensPerSec / 1000); ++iter) {
    ++generation
    updateDeme (mainland,
                params.popSize.value,
                params.mutProb.value,
                () => Math.floor (rand() * genotypes),
                generation)
    islands.forEach ((island) => updateDeme (island,
                                             params.islandPopSize.value,
                                             params.migProb.value,
                                             () => mainland.pop[Math.floor (rand() * mainland.pop.length)],
                                             generation))
  }
  var hues = getHues (genotypes)
  var colors = huesToColors (hues)
  redrawDeme (mainland, colors, hues)
  islands.forEach ((island) => redrawDeme (island, colors, hues))
  if (timer)
    window.clearTimeout (timer)
  if (gensPerSec) {
    var delay = params.gensPerSec.value > 0 ? Math.ceil (1000 / gensPerSec) : 1
    timer = window.setTimeout (update, delay)
  }
}

// https://davidwalsh.name/query-string-javascript
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

