//////////////////////////////////////////////////////////
/////////////// The DevOps Radar Chart   /////////////////
// Modified & Updated Ethan Wilansky and Tomek Stojecki //
///////////////////////// AHL ////////////////////////////
/////////// Inspired by the code of Nadieh Bremer ////////
/////////////////// VisualCinnamon.com ///////////////////
////////////////////// and alangrafu /////////////////////
//////////////////////////////////////////////////////////

function RadarChart(id, data, options) {
	var cfg = {
		w: 600,				//Width of the circle
		h: 600,				//Height of the circle
		margin: { top: 20, right: 20, bottom: 20, left: 20 }, //The margins of the SVG
		levels: 5,				//How many levels or inner circles should there be drawn
		maxValue: 6, 			//What is the value that the biggest circle will represent
		labelFactor: 1.09, 		//How much farther than the radius of the outer circle should the labels be placed
		wrapWidth: 70, 			//The number of pixels after which a label needs to be given a new line
		opacityArea: 0.35, 		//The opacity of the area of the blob
		dotRadius: 3, 			//The size of the colored circles of each blob
		opacityCircles: 0.2, 	//The opacity of the circles of each blob
		strokeWidth: 1, 		//The width of the stroke around each blob
		roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
		color: d3.scaleOrdinal(d3.schemeCategory10) // Color function for D3js v4+
		// some other default color schemes to consider
		// color: d3.scaleOrdinal(d3.schemePaired)
		// color: d3.scaleOrdinal(["#5eb659","#c75a8c","#b3b343","#6585cc","#d24b3d","#4db5a4","#b76a52","#667d38","#cf8f41","#a361c7"])
		};

	//Put all of the options into a variable called cfg
	if ('undefined' !== typeof options) {
		for (var i in options) {
			if ('undefined' !== typeof options[i]) { cfg[i] = options[i]; }
		}//for i
	}//if

	//If the supplied maxValue is smaller than the actual one, replace by the max in the data
	var maxValue = Math.max(cfg.maxValue, d3.max(data, function (i) { return d3.max(i.map(function (o) { return o.value; })) }));

	var allAxis = (data[0].map(function (i, j) { return i.axis })),	//Names of each axis
		total = allAxis.length,					//The number of different axes
		radius = Math.min(cfg.w / 2, cfg.h / 2), 	//Radius of the outermost circle
		Format = d3.format("~s"),			 	//String formatting w/trim insignificant trailing zerosg
		angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

	//Scale for the radius
	var rScale = d3.scaleLinear()
		.range([0, radius])
		.domain([0, maxValue]);

	/////////////////////////////////////////////////////////
	//////////// Create the container SVG and g /////////////
	/////////////////////////////////////////////////////////

	//Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();

	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg")
		.attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
		.attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
		.attr("class", "radar" + id);
	//Append a g element		
	var g = svg.append("g")
		.attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

	/////////////////////////////////////////////////////////
	////////// Glow filter for some extra pizzazz ///////////
	/////////////////////////////////////////////////////////

	//Filter for the outside glow
	var filter = g.append('defs').append('filter').attr('id', 'glow'),
		feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
		feMerge = filter.append('feMerge'),
		feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
		feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

	/////////////////////////////////////////////////////////
	/////////////// Draw the Circular grid //////////////////
	/////////////////////////////////////////////////////////

	//Wrapper for the grid & axes
	var axisGrid = g.append("g").attr("class", "axisWrapper");
	
	function removeInnerArc(path) {
		return path.replace(/(M.*A.*)(A.*Z)/, function(_, m1) {
		  return m1 || path;
		});
	  }

	var r = 332;
	var offsetOuterCircles = 0.01;

	var arcGenerator = d3.arc()
	  .innerRadius(r - 40)
	  .outerRadius(r);

	var arcTextGenerator = d3.arc()
	  .innerRadius(r - 30)
	  .outerRadius(r - 30);

	var outerCirData = [
		{
			label: 'CONTINUOUS EXPLORATION',
			angles: {
				startAngle: offsetOuterCircles, 
				endAngle: Math.PI * 2 / 4 - offsetOuterCircles
			}
		},
		{
			label: 'CONTINUOUS INTEGRATION',
			angles: {
				startAngle: Math.PI * 2 / 4 + offsetOuterCircles, 
				endAngle: Math.PI - offsetOuterCircles
			}
		},
		{
			label: 'CONTINUOUS DEPLOYMENT',
			angles: {
				startAngle: Math.PI + offsetOuterCircles, 
				endAngle: Math.PI * 3 / 2  - offsetOuterCircles
			}
		},
		{
			label: 'RELEASE ON DEMAND',
			angles: {
				startAngle: Math.PI * 3 / 2 + offsetOuterCircles,
				endAngle: Math.PI * 2 - offsetOuterCircles
			}
		}
	];

	var defs = axisGrid.append("defs");

	var textArcPaths = defs.selectAll()
		.data(outerCirData)	
		.enter()
		.append("path")
			.attr("id", function(d, i) { return "text-path-" + i; })
			.attr("d", function(d, i) { return removeInnerArc(arcTextGenerator({
				startAngle: d.angles.startAngle,
				endAngle: d.angles.endAngle
			}));
		});

	axisGrid.selectAll("arcContainer")
			.data(outerCirData)
			.enter()
			.append("path")
				.attr("d", function (d) {
					return arcGenerator({
						startAngle: d.angles.startAngle,
						endAngle: d.angles.endAngle
					});
				})
			.style("fill", "rgb(18, 96, 173)");

	textArcPaths.append("clipPath")
	  .attr("id", "text-clip")
	  .append("use")
	  .attr("xlink:href", "#path");

	axisGrid.selectAll()
		.data(outerCirData)
		.enter()
		.append("text")
		.attr("clip-path", "url(#text-clip)")
		.append("textPath")
		.attr("xlink:href", function (d, i) { return "#text-path-" + i; })
		.text(function (d) { return d.label; })
		// You need the following two lines to position the text correctly
		.attr("text-anchor", "middle")
		.attr("startOffset", "50%")
		.attr("class", "outerLabelText");

	//Draw the background circles
	axisGrid.selectAll(".levels")
		.data(d3.range(1, (cfg.levels + 2)).reverse())
		.enter()
		.append("circle")
		.attr("class", "gridCircle")
		.attr("r", function (d, i) { return radius / cfg.levels * d; })
		.style("fill", "#F7AD3D")
		.style("stroke", "#CDCDCD")
		.style("fill-opacity", cfg.opacityCircles)
		// .style("filter" , "url(#glow)")
		.style("stroke", "black")
		.style("stroke-width", "1px");

	// the rectangles decorating the outer circle
	var rectData = outerCirData.map(d => { 
		return {startAngle: d.angles.startAngle, endAngle:d.angles.startAngle}; 
	});

	d3.select('.axisWrapper')
		.selectAll('.grect')
		.data(rectData)
		.enter()
		.append('g')
		.attr('class', 'grect')
		.attr('transform', d => {
			var centroid = arcGenerator.centroid(d);
			return `translate(${centroid[0]},${centroid[1]})`;
		})
		.append('rect')
		.attr('x', (d, i) => i % 2 == 0 ? -14 : -26)
		.attr('y', (d, i) => i % 2 == 0 ? -28 : -19)
		.attr('width', 30)
		.attr('width', (d, i) => i % 2 == 0 ? 30 : 55 )
		.attr('height', (d, i) => i % 2 == 0 ? 55 : 30 )
		.attr("fill", "rgb(18, 96, 173)")
		.attr("stroke", "black")
		.attr("rx", "10")
		.attr("ry", "10");

	/////////////////////////////////////////////////////////
	//////////////////// Draw the axes //////////////////////
	/////////////////////////////////////////////////////////

	//Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
		.data(allAxis)
		.enter()
		.append("g")
		.attr("class", "axis");
	//Append the lines
	axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", function(d, i){ return rScale(maxValue) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y2", function(d, i){ return rScale(maxValue) * Math.sin(angleSlice*i - Math.PI/2); })
		.attr("class", "line")
		.style("stroke", "black")
		.style("stroke-width", "1px");

	//Append the labels at each axis
	var xyOffset = 52;
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", "11px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", function (d, i) { return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2) - (Math.sin(angleSlice * i - Math.PI / 2) * xyOffset); })
		.attr("y", function (d, i) { return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2) + (Math.cos(angleSlice * i - Math.PI / 2) * xyOffset); })
		.attr("transform", function (d, i) {
			var x = rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2) - (Math.sin(angleSlice * i - Math.PI / 2) * xyOffset);
			var y = rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2) + (Math.cos(angleSlice * i - Math.PI / 2) * xyOffset);

			var degOffset = 12;
			var deg = i * (360 / total) + degOffset;
			var final = "rotate(" + deg + ", " + x + ", " + y + ")";

			//console.log(final);
			return final;
		})
		.text(function (d) { return d; })
		.call(wrap, cfg.wrapWidth);

		//Text indicating each level
		//TODO: replace with circles containing a number for each level
		axisGrid.selectAll(".axisLabel")
		.data(d3.range(1, (cfg.levels)).reverse())
		.enter().append("text")
		.attr("class", "axisLabel")
		.attr("x", -3)
		.attr("y", function (d) { return (-d * radius / cfg.levels) - 20; })
		.attr("dy", "0.4em")
		.style("font-size", "16px")
		.style("font-weight", "bold")
		.attr("fill", "black")
		.text(function (d, i) { return Format(d); });

	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////
	
	//The radial line function
	var radarLine = d3.radialLine()
		.curve(d3.curveLinearClosed)
		.radius(function(d) { return rScale(d.value); })
		.angle(function(d,i) {	return i*angleSlice; });
		
	if (cfg.roundStrokes) {
		radarLine.curve(d3.curveCardinalClosed);
	}
				
	//Create a wrapper for the blobs	
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("transform", "rotate(10)")
		.attr("class", "radarWrapper");
	
	//Append the backgrounds	
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("fill", function(d,i) { return cfg.color(i); })
		.style("id", function(d,i) {return "radarArea" + i; })
		.style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function (d,i){
			//Dim all blobs
			d3.selectAll(".radarArea, .circleGroup")
				.style("fill-opacity", 0.1); 
			d3.select("#circleGroup" + i)
			 	.call(focusBlob, 0.3);
			d3.select(this)
				.call(focusBlob);
		})
		.on('mouseout', function(){
			//Bring back all blobs
			d3.selectAll(".radarArea, .circleGroup")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});

	//Create the outlines	
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("stroke-width", cfg.strokeWidth + "px")
		// .style("stroke", function(d,i) { return cfg.color(i); })
		.style("stroke", "black")
		.style("fill", "none")
		.style("filter" , "url(#glow)");

	// create a group for the circles so circles can be styled and behave with the blob area
	var circleGroup = g.selectAll(".circleGroup")
		.data(data)
		.enter()
		.append("g")
			.attr("class", "circleGroup")
			.attr("transform", "rotate(10)")
			.style("fill-opacity", cfg.opacityArea)
			.style("fill", (d, i) => {
				return cfg.color(i);
			})
			.attr("id", (d, i) => {
				return "circleGroup" + i;
			});

	//Append the circles
	circleGroup.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter()
		.append("circle")
			.attr("class", "radarCircle")
			.attr("id", (d,i) => "radarCircle" + i)
			.attr("r", cfg.dotRadius)
			.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
			.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); });

	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////

	//Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
		.attr("transform", "rotate(10)")
		.attr("class", "radarCircleWrapper");

	// Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarInvisibleCircle")
		.attr("r", cfg.dotRadius*1.5)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", function(d,i) {
			var newX =  parseFloat(d3.select(this).attr('cx')) - 10;
			var newY =  parseFloat(d3.select(this).attr('cy')) - 10;

			tooltip
				.attr('x', newX)
				.attr('y', newY)
				.text(Format(d.value))
				.transition().duration(200)
				.style('opacity', 1);
		})
		.on("mouseout", function(){
			tooltip.transition().duration(200)
				.style("opacity", 0);
		});

	//Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
		.attr("class", "tooltip")
		.attr("transform", "rotate(10)")
		.style("opacity", 0);

	/////////////////////////////////////////////////////////
	/////////////////// Helper Function /////////////////////
	/////////////////////////////////////////////////////////


	//Taken from http://bl.ocks.org/mbostock/7555321
	//Wraps SVG text	
	function wrap(text, width) {
		text.each(function () {
			var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineHeight = 1.4, // ems
				y = text.attr("y"),
				x = text.attr("x"),
				dy = parseFloat(text.attr("dy")),
				tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					line.pop();
					tspan.text(line.join(" "));
					line = [word];
					tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
				}
			}
		});
	}//wrap

	// put the focus on the selected graphical element by increasing opacity
	function focusBlob(selection, increase = 0) {
		selection
			.transition().duration(200)
			.style("fill-opacity", 0.7 + increase); 
	}

}//RadarChart
