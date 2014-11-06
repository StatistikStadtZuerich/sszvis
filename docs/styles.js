var numBars = 9,
    barWidth = 80,
    barHeight = 80;

function makeColorScale(containerId, scaleName) {
    var scale = sszvis.color2[scaleName]().domain([0, numBars - 1]),
        container = document.getElementById(containerId);

    container.style.width = pixels(barWidth * numBars);
    container.style.height = pixels(barHeight);

    d3.range(0, numBars).map(scale).forEach(function(c, i) {
        var colorDiv = document.createElement('div');
        colorDiv.style.position = 'absolute';
        colorDiv.style.left = pixels(i * barWidth);
        colorDiv.style.width = pixels(barWidth);
        colorDiv.style.height = pixels(barHeight);
        colorDiv.style.backgroundColor = c;
        container.appendChild(colorDiv);
    });
}

function pixels(n) { return n + 'px'; }
