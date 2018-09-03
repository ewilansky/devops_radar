//////////////////////////////////////////////////////////
/////////////// The Radar Chart Function /////////////////
/////////////// Altered by Ethan & Tomek /////////////////
///////////////////////// AHL ////////////////////////////
/////////// Inspired by the code of Nadieh Bremer ////////
/////////////////// VisualCinnamon.com ///////////////////
//////////////////////and alangrafu //////////////////////
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
		dotRadius: 4, 			//The size of the colored circles of each blob
		opacityCircles: 0.2, 	//The opacity of the circles of each blob
		strokeWidth: 2, 		//The width of the stroke around each blob
		roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
		color: d3.scaleOrdinal(d3.schemeCategory20c) // Color function for D3js v4+
		// color: d3.scaleOrdinal()
		// 	.domain([1,2,3,4,5,6,7,8,9,10,11])
		// 	.range(['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'])
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

	var r = 308;
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
				start: offsetOuterCircles, 
				end: Math.PI * 2 / 4 - offsetOuterCircles
			}
		},
		{
			label: 'CONTINUOUS INTEGRATION',
			angles: {
				start: Math.PI * 2 / 4 + offsetOuterCircles, 
				end: Math.PI - offsetOuterCircles
			}
		},
		{
			label: 'CONTINUOUS DEPLOYMENT',
			angles: {
				start: Math.PI + offsetOuterCircles, 
				end: Math.PI * 3 / 2  - offsetOuterCircles, 
			}
		},
		{
			label: 'RELEASE ON DEMAND',
			angles: {
				start: Math.PI * 3 / 2 + offsetOuterCircles,
				end: Math.PI * 2 - offsetOuterCircles
			}
		}
	];

	var defs = axisGrid.append("defs");

	var textArcPaths = defs.selectAll("marker")
		.data(outerCirData)	
		.enter()
		.append("path")
			.attr("id", function(d, i) { return "text-path-" + i; })
			.attr("d", function(d, i) { return removeInnerArc(arcTextGenerator({
				startAngle: d.angles.start,
				endAngle: d.angles.end
			}));
		});

	axisGrid.selectAll("arcContainer")
		.data(outerCirData)
		.enter()
		.append("path")
			.attr("d", function (d) {
				return arcGenerator({
					startAngle: d.angles.start,
					endAngle: d.angles.end
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

	//Text indicating each level
	//TODO: replace with circles containing a number for each level
	axisGrid.selectAll(".axisLabel")
		.data(d3.range(1, (cfg.levels)).reverse())
		.enter().append("text")
		.attr("class", "axisLabel")
		.attr("x", -3)
		.attr("y", function (d) { return (-d * radius / cfg.levels) - 20; })
		.attr("dy", "0.4em")
		.style("font-size", "12px")
		.style("font-weight", "bold")
		.attr("fill", "black")
		.text(function (d, i) { return Format(d); });
		// .text(function (d, i) { return Format(maxValue * d / cfg.levels); });


	//Append the labels at each axis
	var xyOffset = 47;
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

		//Text indicating numeric level
		axisGrid.selectAll(".axisLabel")
			.data(d3.range(1,(cfg.levels)).reverse())
			.enter().append("text")
			.attr("class", "axisLabel")
			.attr("x", -3)
			.attr("y", function(d){return -d*radius/cfg.levels;})
			.attr("dy", "0.4em")
			.style("font-size", "12px")
			.attr("fill", "#737373")
			.text(function (d, i) { return Format(d); });
			// .text(function(d,i) { return Format(maxValue * d/cfg.levels); });
	

	/////////////////////////////////////////////////////////
	///////////// Draw the radar chart blobs ////////////////
	/////////////////////////////////////////////////////////
	
	//The radial line function
	var radarLine = d3.radialLine()
		// .interpolate("linear-closed")
		.radius(function(d) { return rScale(d.value); })
		.angle(function(d,i) {	return i*angleSlice; });

		d3.curveLinearClosed(radarLine);
		
	if(cfg.roundStrokes) {
		// radarLine.interpolate("cardinal-closed");
		d3.curveCardinalClosed(radarLine);
	}
				
	//Create a wrapper for the blobs	
	var blobWrapper = g.selectAll(".radarWrapper")
		.data(data)
		.enter().append("g")
		.attr("class", "radarWrapper");
	
	//Append the backgrounds	
	blobWrapper
		.append("path")
		.attr("class", "radarArea")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("fill", function(d,i) { return cfg.color(i); })
		.style("fill-opacity", cfg.opacityArea)
		.on('mouseover', function (d,i){
			//Dim all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", 0.1); 
			//Bring back the hovered over blob
			d3.select(this)
				.transition().duration(200)
				.style("fill-opacity", 0.7);	
		})
		.on('mouseout', function(){
			//Bring back all blobs
			d3.selectAll(".radarArea")
				.transition().duration(200)
				.style("fill-opacity", cfg.opacityArea);
		});

	//Create the outlines	
	blobWrapper.append("path")
		.attr("class", "radarStroke")
		.attr("d", function(d,i) { return radarLine(d); })
		.style("stroke-width", cfg.strokeWidth + "px")
		.style("stroke", function(d,i) { return cfg.color(i); })
		.style("fill", "none")
		.style("filter" , "url(#glow)");		

	//Append the circles
	blobWrapper.selectAll(".radarCircle")
		.data(function(d,i) { return d; })
		.enter().append("circle")
		.attr("class", "radarCircle")
		.attr("r", cfg.dotRadius)
		.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
		.style("fill", function(d,i,j) { return cfg.color(j); })
		.style("fill-opacity", 0.8);

	/////////////////////////////////////////////////////////
	//////// Append invisible circles for tooltip ///////////
	/////////////////////////////////////////////////////////

	//Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
		.data(data)
		.enter().append("g")
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

}//RadarChart
