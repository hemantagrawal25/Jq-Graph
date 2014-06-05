/*********************************************************************************************************************
The MIT License (MIT)

Copyright (c) 2014,Hemant Agrawal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**************************************************************************************************************************/

	/**	 
 	 * it draw pie chart with animation 
 	 */ 	
function pieChart(jsonData, chartid) {

	// Config settings
	var chartSizePercent = 75;
	// The chart radius relative to the canvas width/height (in percent)
	var sliceBorderWidth = 1;
	// Width (in pixels) of the border around each slice
	var sliceBorderStyle = "#fff";
	// Colour of the border around each slice
	var sliceGradientColour = "#ddd";
	// Colour to use for one end of the chart gradient
	var maxPullOutDistance = 20;
	// How far, in pixels, to pull slices out when clicked
	var pullOutFrameStep = 2;
	// How many pixels to move a slice with each animation frame
	var pullOutFrameInterval = 40;
	// How long (in ms) between each animation frame
	var pullOutLabelPadding = 30;
	// Padding between pulled-out slice and its label
	var pullOutLabelFont = "12px Arial, Verdana, sans-serif";
	// Pull-out slice label font
	var pullOutValueFont = "12px Arial, Verdana, sans-serif";
	// Pull-out slice value font
	var pullOutValuePrefix = "";
	// Pull-out slice value prefix
	var pullOutShadowColour = "rgba( 0, 0, 0, .5 )";
	// Colour to use for the pull-out slice shadow
	var pullOutShadowOffsetX = 5;
	// X-offset (in pixels) of the pull-out slice shadow
	var pullOutShadowOffsetY = 5;
	// Y-offset (in pixels) of the pull-out slice shadow
	var pullOutShadowBlur = 5;
	// How much to blur the pull-out slice shadow
	var pullOutBorderWidth = 2;
	// Width (in pixels) of the pull-out slice border
	var pullOutBorderStyle = "#333";
	// Colour of the pull-out slice border
	var chartStartAngle = -.5 * Math.PI;
	// Start the chart at 12 o'clock instead of 3 o'clock

	// Declare some variables for the chart
	var canvas;
	// The canvas element in the page
	var currentPullOutSlice = -1;
	// The slice currently pulled out (-1 = no slice)
	var currentPullOutDistance = 0;
	// How many pixels the pulled-out slice is currently pulled out in the animation
	var animationId = 0;
	// Tracks the interval ID for the animation created by setInterval()
	var chartData = [];
	// Chart data (labels, values, and angles)
	var chartColours = [];
	// Chart colours (pulled from the HTML table)
	var totalValue = 0;
	// Total of all the values in the chart
	var canvasWidth;
	// Width of the canvas, in pixels
	var canvasHeight;
	// Height of the canvas, in pixels
	var centreX;
	// X-coordinate of centre of the canvas/chart
	var centreY;
	// Y-coordinate of centre of the canvas/chart
	var chartRadius;
	// Radius of the pie chart, in pixels
	var flag = 0;

	var ct = 0;
	var sliceArray = [];
	// Set things up and draw the chart
	init();

	/**
	 * Set up the chart data and colours, as well as the chart and draw the initial pie chart
	 */

	function init() {

		// Get the canvas element in the page
		canvas = document.getElementById(chartid);

		// Exit if the browser isn't canvas-capable
		if ( typeof canvas.getContext === 'undefined')
			return;

		// Initialise some properties of the canvas and chart
		canvasWidth = canvas.width;
		canvasHeight = canvas.height;
		centreX = canvasWidth / 2;
		centreY = canvasHeight / 2;
		chartRadius = Math.min(canvasWidth, canvasHeight) / 2 * (chartSizePercent / 100);

		// Grab the data from the json,		
		var currentPos = 0;
		var currentRow = 1;		
		var hex;
		if (jsonData.xdata.length > 0) {
			for(var i=0;i<jsonData.xdata.length ;i++,currentRow++){
				var value = parseFloat(jsonData.ydata[i]);								
				totalValue += value;
				value = value.toFixed(2);				
				chartData[currentRow] = [];
				chartData[currentRow]['label']=jsonData.xdata[i];				
				chartData[currentRow]['value']=value;
				hex = (jsonData.color[i]).match(/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/);
				chartColours[currentRow] = [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
			}			
			// The current position of the slice in the pie (from 0 to 1)
			for (var slice in chartData) {
				chartData[slice]['startAngle'] = 2 * Math.PI * currentPos;
				chartData[slice]['endAngle'] = 2 * Math.PI * (currentPos + (chartData[slice]['value'] / totalValue));
				currentPos += chartData[slice]['value'] / totalValue;
			}			
		}else{
			currentRow = 2;
			chartData[currentRow] = [];
			chartData[currentRow]['label'] = "No Records";
			chartData[currentRow]['value'] = 0;			
			hex = "#ED5713".match(/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/);
			chartColours[currentRow] = [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
			totalValue = 100;
			flag = 1;						
			// The current position of the slice in the pie (from 0 to 1)
			for (var slice in chartData) {
				chartData[slice]['startAngle'] = 2 * Math.PI * currentPos;
				chartData[slice]['endAngle'] = 2 * Math.PI * (currentPos + (100 / totalValue));
				currentPos += 100 / totalValue;
			}
		}		
		
		// All ready! Now draw the pie chart, and add the click handler to it
		drawChart();
		$("#" + chartid).click(handleChartClick);
	}

	/**
	 * Process mouse clicks in the chart area.
	 *
	 * If a slice was clicked, toggle it in or out. If the user clicked outside
	 * the pie, push any slices back in.
	 *
	 * @param Event
	 *            The click event
	 */

	function handleChartClick(clickEvent) {

		// Get the mouse cursor position at the time of the click, relative to the canvas
		var parentOffset = $(this).parent().offset();
		var mouseX = clickEvent.pageX - parentOffset.left;
		var mouseY = clickEvent.pageY - parentOffset.top;

		// Was the click inside the pie chart?
		var xFromCentre = mouseX - centreX;
		var yFromCentre = mouseY - centreY;
		var distanceFromCentre = Math.sqrt(Math.pow(Math.abs(xFromCentre), 2) + Math.pow(Math.abs(yFromCentre), 2));

		if (distanceFromCentre <= chartRadius) {

			// Yes, the click was inside the chart.
			// Find the slice that was clicked by comparing angles relative to the chart centre.

			var clickAngle = Math.atan2(yFromCentre, xFromCentre) - chartStartAngle;
			if (clickAngle < 0)
				clickAngle = 2 * Math.PI + clickAngle;

			for (var slice in chartData) {
				if (clickAngle >= chartData[slice]['startAngle'] && clickAngle <= chartData[slice]['endAngle']) {

					// Slice found. Pull it out or push it in, as required.
					toggleSlice(slice);
					return;
				}
			}
		}

		// User must have clicked outside the pie. Push any pulled-out slice back in.
		pushIn();
	}

	/**
	 * Process mouse clicks in the table area.
	 *
	 * Retrieve the slice number from the jQuery data stored in the clicked
	 * table cell, then toggle the slice
	 *
	 * @param Event
	 *            The click event
	 */

	function handleTableClick(clickEvent) {
		var slice = $(this).data('slice');
		toggleSlice(slice);
	}

	/**
	 * Push a slice in or out.
	 *
	 * If it's already pulled out, push it in. Otherwise, pull it out.
	 *
	 * @param Number
	 *            The slice index (between 0 and the number of slices - 1)
	 */

	function toggleSlice(slice) {
		if (slice == currentPullOutSlice) {
			pushIn();
		} else {
			startPullOut(slice);
		}
	}

	/**
	 * Start pulling a slice out from the pie.
	 *
	 * @param Number
	 *            The slice index (between 0 and the number of slices - 1)
	 */

	function startPullOut(slice) {

		// Exit if we're already pulling out this slice
		if (currentPullOutSlice == slice)
			return;

		// Record the slice that we're pulling out, clear any previous animation, then start the animation
		currentPullOutSlice = slice;
		currentPullOutDistance = 0;
		clearInterval(animationId);
		animationId = setInterval(function() {
			animatePullOut(slice);
		}, pullOutFrameInterval);
	}

	/**
	 * Draw a frame of the pull-out animation.
	 *
	 * @param Number
	 *            The index of the slice being pulled out
	 */

	function animatePullOut(slice) {

		// Pull the slice out some more
		currentPullOutDistance += pullOutFrameStep;

		// If we've pulled it right out, stop animating
		if (currentPullOutDistance >= maxPullOutDistance) {
			clearInterval(animationId);
			return;
		}

		// Draw the frame
		drawChart();
	}

	/**
	 * Push any pulled-out slice back in.
	 *
	 * Resets the animation variables and redraws the chart. Also un-highlights
	 * all rows in the table.
	 */

	function pushIn() {
		currentPullOutSlice = -1;
		currentPullOutDistance = 0;
		clearInterval(animationId);
		drawChart();		
	}

	/**
	 * Draw the chart.
	 *
	 * Loop through each slice of the pie, and draw it.
	 */

	function drawChart() {		
		// Get a drawing context
		var context = canvas.getContext('2d');
		// Clear the canvas, ready for the new frame
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		if (flag == 0) {			
			for (var slice in chartData) {
				sliceArray[ct++] = slice;
				if (slice != currentPullOutSlice) {
					drawSliceAnimation(context, slice);
				}
			}
			flag = 1;
			ct = 0;
			setTimeout(slicePart, 500);
		} else {
			for (var slice in chartData) {
				if (slice != currentPullOutSlice) {				
					drawSlice(context, slice);
				}
			}
		}
		// If there's a pull-out slice in effect, draw it.
		// (We draw the pull-out slice last so its drop shadow doesn't get painted over.)
		if (currentPullOutSlice != -1)
			drawSlice(context, currentPullOutSlice);

	}

	function slicePart() {
		toggleSlice(sliceArray[ct]);
		ct++;
		if (ct <= sliceArray.length) {
			setTimeout(slicePart, 500);
		} else {
			currentPullOutSlice = -1;
		}
	}

	/**
	 * Draw an individual slice in the chart.
	 *
	 * @param Context
	 *            A canvas context to draw on
	 * @param Number
	 *            The index of the slice to draw
	 */

	function drawSliceAnimation(context, slice) {

		// Compute the adjusted start and end angles for the slice
		var startAngle = chartData[slice]['startAngle'] + chartStartAngle;
		var endAngle = chartData[slice]['endAngle'] + chartStartAngle;

		var angle = startAngle;
		function f() {
			// This slice isn't pulled out, so draw it from the pie centre
			startX = centreX;
			startY = centreY;

			// Set up the gradient fill for the slice
			var sliceGradient = context.createLinearGradient(0, 0, canvasWidth * .75, canvasHeight * .75);
			sliceGradient.addColorStop(0, sliceGradientColour);			
			sliceGradient.addColorStop(1, 'rgb(' + chartColours[slice].join(',') + ')');
			// Draw the slice
			context.beginPath();
			context.moveTo(startX, startY);
			context.arc(startX, startY, chartRadius, startAngle, angle, false);
			context.lineTo(startX, startY);
			context.closePath();
			context.fillStyle = sliceGradient;
			context.shadowColor = (slice == currentPullOutSlice) ? pullOutShadowColour : "rgba( 0, 0, 0, 0 )";
			context.fill();
			context.shadowColor = "rgba( 0, 0, 0, 0 )";
			if (slice == currentPullOutSlice) {
				context.lineWidth = pullOutBorderWidth;
				context.strokeStyle = pullOutBorderStyle;
			} else {
				context.lineWidth = sliceBorderWidth;
				context.strokeStyle = sliceBorderStyle;
			}

			// Draw the slice border
			context.stroke();
			var lastangle = angle;
			angle = angle + 0.5;
			if (angle < endAngle) {
				setTimeout(f, 70);
			} else if (lastangle < endAngle) {
				angle = endAngle;
				lastangle = endAngle;
				f();
			}
		}

		f();
	}

	function drawSlice(context, slice) {
		// Compute the adjusted start and end angles for the slice
		var startAngle = chartData[slice]['startAngle'] + chartStartAngle;
		var endAngle = chartData[slice]['endAngle'] + chartStartAngle;

		if (slice == currentPullOutSlice) {			
			// We're pulling (or have pulled) this slice out.
			// Offset it from the pie centre, draw the text label, and add a drop shadow.

			var midAngle = (startAngle + endAngle) / 2;
			var actualPullOutDistance = currentPullOutDistance * easeOut(currentPullOutDistance / maxPullOutDistance, .8);
			startX = centreX + Math.cos(midAngle) * actualPullOutDistance;
			startY = centreY + Math.sin(midAngle) * actualPullOutDistance;			
			context.fillStyle = 'rgb(' + chartColours[slice].join(',') + ')';
			context.textAlign = "center";
			context.font = pullOutLabelFont;
			context.fillText(chartData[slice]['label'], centreX + Math.cos(midAngle) * (chartRadius + maxPullOutDistance + pullOutLabelPadding), centreY + Math.sin(midAngle) * (chartRadius + maxPullOutDistance + pullOutLabelPadding));
			context.font = pullOutValueFont;
			context.fillText(pullOutValuePrefix + chartData[slice]['value'] + " (" + (parseInt(chartData[slice]['value'] / totalValue * 100 + .5)) + "%)", centreX + Math.cos(midAngle) * (chartRadius + maxPullOutDistance + pullOutLabelPadding), centreY + Math.sin(midAngle) * (chartRadius + maxPullOutDistance + pullOutLabelPadding) + 10);
			context.shadowOffsetX = pullOutShadowOffsetX;
			context.shadowOffsetY = pullOutShadowOffsetY;
			context.shadowBlur = pullOutShadowBlur;

		} else {

			// This slice isn't pulled out, so draw it from the pie centre
			startX = centreX;
			startY = centreY;
			var midAngle = (startAngle + endAngle) / 2;
			var actualPullOutDistance = currentPullOutDistance * easeOut(currentPullOutDistance / maxPullOutDistance, .8);
			context.fillStyle = 'rgb(' + chartColours[slice].join(',') + ')';
			context.textAlign = "left";
			context.font = pullOutLabelFont;
			var label = chartData[slice]['label'].length > 10 ? chartData[slice]['label'].substring(0, 10) + "..." : chartData[slice]['label'];
			context.fillText(label + " , " + chartData[slice]['value'] + " (" + (parseInt(chartData[slice]['value'] / totalValue * 100 + .5)) + "%)", 5, 22 * (slice - 1));
			context.font = pullOutValueFont;
			/*context.fillText(chartData[slice]['label'], centreX + Math.cos(midAngle) * (chartRadius + maxPullOutDistance + pullOutLabelPadding - 22), centreY + Math.sin(midAngle)
			 * (chartRadius + maxPullOutDistance + pullOutLabelPadding - 22));
			 */
			context.font = pullOutValueFont;
			/*context.fillText(pullOutValuePrefix + chartData[slice]['value'] + " (" + (parseInt(chartData[slice]['value'] / totalValue * 100 + .5)) + "%)", centreX
			 + Math.cos(midAngle) * (chartRadius + maxPullOutDistance + pullOutLabelPadding - 22), centreY + Math.sin(midAngle)
			 * (chartRadius + maxPullOutDistance + pullOutLabelPadding - 22) + 10);
			 */
			context.shadowOffsetX = pullOutShadowOffsetX;
			context.shadowOffsetY = pullOutShadowOffsetY;
			context.shadowBlur = pullOutShadowBlur;
		}

		// Set up the gradient fill for the slice
		var sliceGradient = context.createLinearGradient(0, 0, canvasWidth * .75, canvasHeight * .75);
		sliceGradient.addColorStop(0, sliceGradientColour);
		sliceGradient.addColorStop(1, 'rgb(' + chartColours[slice].join(',') + ')');

		// Draw the slice
		context.beginPath();
		context.moveTo(startX, startY);
		context.arc(startX, startY, chartRadius, startAngle, endAngle, false);
		context.lineTo(startX, startY);
		context.closePath();
		context.fillStyle = sliceGradient;
		context.shadowColor = (slice == currentPullOutSlice) ? pullOutShadowColour : "rgba( 0, 0, 0, 0 )";
		context.fill();
		context.shadowColor = "rgba( 0, 0, 0, 0 )";

		// Style the slice border appropriately
		if (slice == currentPullOutSlice) {
			context.lineWidth = pullOutBorderWidth;
			context.strokeStyle = pullOutBorderStyle;
		} else {
			context.lineWidth = sliceBorderWidth;
			context.strokeStyle = sliceBorderStyle;
		}

		// Draw the slice border
		context.stroke();
	}

	/**	 
	 * @param Number
	 *            The ratio of the current distance travelled to the maximum
	 *            distance
	 * @param Number
	 *            The power (higher numbers = more gradual easing)
	 * @return Number The new ratio
	 */

	function easeOut(ratio, power) {
		return (Math.pow(1 - ratio, power) + 1);
	}

}
/**	 
 * @param Event
 *       Draw bar graph 
*/

function barGraph(graphId, jsonData) {
	var max = 0;
	var count = 0;
	var differenceArray = [];
	var percentageArray = [];
	var graphurl = [];
	var YaxisdataArray = [];
	var XaxisdataArray = [];
	var color = ["#74A82A", "#D55511", "#3565A1", "#A42F11", "#DC6D1C", "#0DA921", "#4C4E47", "#9F705B", "#643EA0", "#F6A615", "#CB1F26", "#B33D5A", "#EEA435", "#F6A615"];
	init();
	
	/**	 
 	 * initialise this method. parse json and assigned value to different variable. 
 	 */   

	function init() {
		if (jsonData.xdata.length > 0) {
			color = jsonData.color;
			getMax();
			var temp = max / jsonData.limit;
			var diff = max;
			var val;
			var yval;
			for (var i = 0; i < jsonData.limit; i++, diff = diff - temp) {
				if (jsonData.xdata.length > i) {
					yval = parseFloat(jsonData.ydata[i]);
					val = ((yval * 74) / max);
					val = val < 1 ? val + 1 : val;
					XaxisdataArray.push(jsonData.xdata[i]);
					YaxisdataArray.push(getFormattedColumn(jsonData.ydata[i], jsonData.format));
					graphurl.push(jsonData.url);
					count = count + 1;
				} else {
					val = 0;
					XaxisdataArray.push(" ");
					YaxisdataArray.push(" ");
					graphurl.push(" ");
				}
				percentageArray.push(val.toString());
				differenceArray.push(getFormattedColumn(diff, jsonData.format));
			}
		} else {
			for (var i = 0; i < jsonData.limit; i++) {
				XaxisdataArray.push(" ");
				YaxisdataArray.push(" ");
				graphurl.push(" ");
				percentageArray.push(" ");
				differenceArray.push(" ");
			}
		}
		if (count == 0) {
			count = 1;
		}
		drawBarGraph();
	}
	
	/**	 
 	 * draw the graph with animation. 
 	 */

	function drawBarGraph() {
		$("#" + graphId).append("<div  class='manageGraphXLine'></div>");
		$("#" + graphId).append("<div  class='managerGraphLabelHorizontal rotate'>" + jsonData.ylabel + "</div>");
		$("#" + graphId).append("<div  class='managerGraphLabelVertical'>" + jsonData.xlabel + "</div>");
		if (XaxisdataArray.length > 0) {
			var top = 5;
			var height = 5;
			var xCnt = 0;
			var colorint = 0;
			var lt = XaxisdataArray.length;
			var diff = 74 / 5;
			var leftDiff = 74 / 5;
			if (lt >= 10) {
				lt = 10;
				diff = 7;
				leftDiff = 74 / 10;
			} else {
				leftDiff = 74 / 5;
			}
			diff = 74 / count;
			height = diff / 2;
			left = 20 + leftDiff;
			$("#" + graphId).append("<div class='manageGraphYLine'  style='z-index:1030;left:20%'></div>");
			$("#" + graphId).append("<div class='managerGraphLabelX' style='bottom:8%;left:20%'>0</div>");
			var left = 20 + leftDiff;
			var ycnt = XaxisdataArray.length - 1;
			for ( xCnt = 0; xCnt < XaxisdataArray.length; ycnt--, xCnt++, top = top + diff, left = left + leftDiff, colorint = colorint + 1) {
				$("#" + graphId).append("<div class='managerGraphLabelY' style='top:" + top + "%' onmouseover='mytooltipfun($(this),\"" + XaxisdataArray[xCnt] + "\")' data-text-tooltip='" + XaxisdataArray[xCnt] + "'  onmouseout='mytooltipremovefun($(this))' data-style-tooltip='tooltip-soft-blue'  >" + XaxisdataArray[xCnt] + " </div>");
				$("#" + graphId).append("<div  class='managerGraphLabelX' style='bottom:8%;left:" + (left - 1) + "%'>" + differenceArray[ycnt] + "</div>");
				$("#" + graphId).append("<div class='manageGraphYLine'  style='left:" + left + "%'></div>");
				$("#" + graphId).append("<div id='bar" + graphId + "_" + (xCnt + 1) + "_0' onClick=\"" + graphurl[xCnt] + "\" class='manageGraphXaxisLine'  style='background:" + color[colorint] + ";height:" + height + "%;width:0%;top:" + (top) + "%'  onmouseover='mytooltipfun($(this),\"" + YaxisdataArray[xCnt] + "\")' data-text-tooltip='" + YaxisdataArray[xCnt] + "'  onmouseout='mytooltipremovefun($(this))' data-style-tooltip='tooltip-soft-blue'></div>");
				$("#" + graphId).append("<div  id='graphlb" + graphId + "_" + (xCnt + 1) + "_0' class='managerGraphLabel'  style='left:" + (parseInt(percentageArray[xCnt]) + 21) + "%;top:" + (top) + "%'>" + YaxisdataArray[xCnt] + "</div>");

				if (colorint > color.length) {
					colorint = 0;
				}			
				$("#bar" + graphId + "_" + (xCnt + 1) + "_0").animate({
					width : (percentageArray[xCnt]) + '%'
				}, 1500, function() {
				});
				$("#graphlb" + graphId + "_" + (xCnt + 1) + "_0").css({
					"display" : "block",
					"opacity" : "0"
				}).animate({
					"opacity" : "1"
				}, 2000);

			}
			for (; xCnt < percentageArray.length; ycnt--, xCnt++, top = top + diff, left = left + leftDiff) {
				if (xCnt % 2 == 0) {
					$("#" + graphId).append("<div  class='managerGraphLabelX' style='bottom:8%;left:" + (left - 1) + "%'>" + differenceArray[ycnt] + "</div>");
				} else {
					$("#" + graphId).append("<div class='managerGraphLabelX' style='bottom:10%;left:" + (left - 1) + "%'>" + differenceArray[ycnt] + "</div>");
				}
				$("#" + graphId).append("<div class='manageGraphYLine'  style='left:" + left + "%'></div>");
			}
		}
	}

	/**	 
 	 *  get maximum value for decide no of x value and different between x1 to x2 or so on. 
 	 */
	function getMax() {
		var temp = 0;

		for (var i = 0; i < jsonData.ydata.length; i++) {
			temp = parseInt(jsonData.ydata[i]);
			if (temp > max) {
				max = temp;
			}
		}
		var first = 0;
		var maxVal = "";
		var maxstr = max.toString();
		if (maxstr == "0") {
			first = 0;
		} else {
			first = parseInt(maxstr.substring(0, 1)) + 1;
		}
		for (var i = 1; i < $.trim(maxstr).length; i++) {
			maxVal += "0";
		}
		max = parseInt("" + first + maxVal.trim());
	}

	/**	 
 	 * it convert value from bytes to size so it shows proper formatted 
 	 */
	function bytesToSize(bytes, precision) {
		var kilobyte = 1024;
		var megabyte = kilobyte * 1024;
		var gigabyte = megabyte * 1024;
		var terabyte = gigabyte * 1024;

		if ((bytes >= 0) && (bytes < kilobyte)) {
			return bytes + ' B';

		} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
			return (bytes / kilobyte).toFixed(precision) + ' KB';

		} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
			return (bytes / megabyte).toFixed(precision) + ' MB';

		} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
			return (bytes / gigabyte).toFixed(precision) + ' GB';

		} else if (bytes >= terabyte) {
			return (bytes / terabyte).toFixed(precision) + ' TB';

		} else {
			return bytes + ' B';
		}
	}
	/**	 
 	 * it convert value in proper formatted. 
 	 */
	function getFormattedColumn(columndata, format) {
		if (format == 2) {
			return bytesToSize(columndata, 2);
		} else if (format == 3) {
			var data = parseFloat(columndata)
			return data.toFixed(2) + "%";
		} else {
			return columndata >= 1000 ? columndata / 1000 + "K" : columndata;
		}
	}

}
/**	 
 * @param Event
 *       Draw column graph 
*/
function columnbarGraph(graphId, jsonData) {
	var max = 0;
	var count = 0;
	var differenceArray = [];
	var percentageArray = [];
	var graphurl = [];
	var YaxisdataArray = [];
	var XaxisdataArray = [];
	var color = ["#74A82A", "#D55511", "#3565A1", "#A42F11", "#DC6D1C", "#0DA921", "#4C4E47", "#9F705B", "#643EA0", "#F6A615", "#CB1F26", "#B33D5A", "#EEA435", "#F6A615"];
	init();
	/**	 
 	 * initialise this method. parse json and assigned value to different variable. 
 	 */
	function init() {
		if (jsonData.xdata.length > 0) {
			color = jsonData.color;
			getMax();
			var temp = max / jsonData.limit;
			var diff = max;
			var val;
			var yval;
			for (var i = 0; i < jsonData.limit; i++, diff = diff - temp) {
				if (jsonData.xdata.length > i) {
					yval = parseFloat(jsonData.ydata[i]);
					val = ((yval * 74) / max);
					val = val < 1 ? val + 1 : val;
					XaxisdataArray.push(jsonData.xdata[i]);
					YaxisdataArray.push(getFormattedColumn(jsonData.ydata[i], jsonData.format));
					graphurl.push(jsonData.url);
					count = count + 1;
				} else {
					val = 0;
					XaxisdataArray.push(" ");
					YaxisdataArray.push(" ");
					graphurl.push(" ");
				}
				percentageArray.push(val.toString());
				differenceArray.push(getFormattedColumn(diff, jsonData.format));
			}
		} else {
			for (var i = 0; i < jsonData.limit; i++) {
				XaxisdataArray.push(" ");
				YaxisdataArray.push(" ");
				graphurl.push(" ");
				percentageArray.push("0");
				differenceArray.push(" ");
			}
		}
		if (count == 0) {
			count = 1;
		}
		drawColumnGraph();
	}

	/**	 
 	 * draw the graph with animation. 
 	 */
	function drawColumnGraph() {
		var color = ["#74A82A", "#D55511", "#3565A1", "#A42F11", "#DC6D1C", "#0DA921", "#4C4E47", "#9F705B", "#643EA0", "#F6A615", "#CB1F26", "#B33D5A", "#EEA435", "#F6A615"];
		$("#" + graphId).append("<div  class='manageGraphXLine'></div>");
		$("#" + graphId).append("<div  class='managerGraphLabelHorizontal rotate'>" + jsonData.xlabel + "</div>");
		$("#" + graphId).append("<div  class='managerGraphLabelVertical'>" + jsonData.ylabel + "</div>");
		if (XaxisdataArray.length > 0) {

			var top = 5;
			var width = 5;
			var xCnt = 0;
			var colorint = 0;
			var lt = XaxisdataArray.length;
			var diff = 74 / 5;
			var leftDiff = 74 / 5;
			if (lt >= 10) {
				lt = 10;
				diff = 7;
				leftDiff = 74 / 10;
			} else {
				leftDiff = 74 / 5;
			}
			diff = 74 / count;
			width = diff / 2;
			left = 18 + leftDiff;
			var ycnt = XaxisdataArray.length - 1;

			$("#" + graphId).append("<div class='manageGraphYLine'  style='z-index:1030;left:20%'></div>");
			$("#" + graphId).append("<div class='managerGraphLabelX' style='bottom:8%;left:20%'>0</div>");
			for ( xCnt = 0; xCnt < XaxisdataArray.length; ycnt--, xCnt++, top = top + diff, left = left + leftDiff,colorint=colorint+1) {
				$("#" + graphId).append("<div class='managerGraphLabelY' style='top:" + (top) + "%' onmouseover='mytooltipfun($(this),\"" + differenceArray[xCnt] + "\")' data-text-tooltip='" + differenceArray[xCnt] + "'  onmouseout='mytooltipremovefun($(this))' data-style-tooltip='tooltip-soft-blue'  >" + differenceArray[xCnt] + " </div>");
				$("#" + graphId).append("<div  class='managerGraphLabelX' style='bottom:8%;left:" + (left - 4) + "%'>" + XaxisdataArray[ycnt] + "</div>");
				$("#" + graphId).append("<div class='manageGraphXLine'  style='top:" + (top) + "%'></div>");
				$("#" + graphId).append("<div id='column" + graphId + "_" + (ycnt + 1) + "_0' onClick=\"" + graphurl[ycnt] + "\" class='manageGraphYaxisLine'  style='background:" + color[colorint] + ";width:" + width + "%;height:0%;left:" + (left - 5) + "%'  onmouseover='mytooltipfun($(this),\"" + YaxisdataArray[ycnt] + "\")' data-text-tooltip='" + YaxisdataArray[ycnt] + "'  onmouseout='mytooltipremovefun($(this))' data-style-tooltip='tooltip-soft-blue'></div>");
				$("#" + graphId).append("<div  id='graphlb" + graphId + "_" + (ycnt + 1) + "_0' class='managerGraphLabel'  style='left:" + (left - 3.5) + "%;bottom:" + (parseInt(percentageArray[ycnt]) + 21) + "%;'>" + YaxisdataArray[ycnt] + "</div>");				

				$("#column" + graphId + "_" + (ycnt + 1) + "_0").animate({
					height : (percentageArray[ycnt]) + '%'
				}, 1500, function() {
				});
				$("#graphlb" + graphId + "_" + (ycnt + 1) + "_0").css({
					"display" : "block",
					"opacity" : "0"
				}).animate({
					"opacity" : "1"
				}, 2000);
				
				if (colorint > color.length) {
					colorint = 0;
				}			

			}
			for (; xCnt < percentageArray.length; ycnt--, xCnt++, top = top + diff, left = left + leftDiff) {
				if (xCnt % 2 == 0) {
					$("#" + graphId).append("<div  class='managerGraphLabelX' style='bottom:8%;left:" + (left - 1) + "%'>" + differenceArray[ycnt] + "</div>");
				} else {
					$("#" + graphId).append("<div class='managerGraphLabelX' style='bottom:10%;left:" + (left - 1) + "%'>" + differenceArray[ycnt] + "</div>");
				}
				$("#" + graphId).append("<div class='manageGraphYLine'  style='left:" + left + "%'></div>");
			}
		}
	}
	/**	 
 	 *  get maximum value for decide no of x value and different between x1 to x2 or so on. 
 	 */
	function getMax() {
		var temp = 0;

		for (var i = 0; i < jsonData.ydata.length; i++) {
			temp = parseInt(jsonData.ydata[i]);
			if (temp > max) {
				max = temp;
			}
		}
		var first = 0;
		var maxVal = "";
		var maxstr = max.toString();
		if (maxstr == "0") {
			first = 0;
		} else {
			first = parseInt(maxstr.substring(0, 1)) + 1;
		}
		for (var i = 1; i < $.trim(maxstr).length; i++) {
			maxVal += "0";
		}
		max = parseInt("" + first + maxVal.trim());
	}
	/**	 
 	 * it convert value from bytes to size so it shows proper formatted 
 	 */
	function bytesToSize(bytes, precision) {
		var kilobyte = 1024;
		var megabyte = kilobyte * 1024;
		var gigabyte = megabyte * 1024;
		var terabyte = gigabyte * 1024;

		if ((bytes >= 0) && (bytes < kilobyte)) {
			return bytes + ' B';

		} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
			return (bytes / kilobyte).toFixed(precision) + ' KB';

		} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
			return (bytes / megabyte).toFixed(precision) + ' MB';

		} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
			return (bytes / gigabyte).toFixed(precision) + ' GB';

		} else if (bytes >= terabyte) {
			return (bytes / terabyte).toFixed(precision) + ' TB';

		} else {
			return bytes + ' B';
		}
	}
	/**	 
 	 * it convert value in proper formatted. 
 	 */
	function getFormattedColumn(columndata, format) {
		if (format == 2) {
			return bytesToSize(columndata, 2);
		} else if (format == 3) {
			var data = parseFloat(columndata)
			return data.toFixed(2) + "%";
		} else {
			return columndata >= 1000 ? columndata / 1000 + "K" : columndata;
		}
	}

}
	/**	 
 	 * this function decided that which graph will draw. 
 	 * it is parse parse xml to json if input come in xml 
 	 */
function changeGraph(chartType, id, root, type) {
	var barJson;
	document.getElementById('' + id).innerHTML = "";	
	if (type == "xml") {
		var graph = root.getElementsByTagName('graph').item(0);
		var xdata = graph.getElementsByTagName('xdata')[0].childNodes[0].nodeValue;
		var ydata = graph.getElementsByTagName('ydata')[0].childNodes[0].nodeValue;
		var url = graph.getElementsByTagName('url')[0].childNodes[0].nodeValue;
		var xlb = graph.getElementsByTagName('xdata')[0].getAttribute('label');
		var ylb = graph.getElementsByTagName('ydata')[0].getAttribute('label');
		var limit = graph.getElementsByTagName('url')[0].getAttribute('limit');
		var format = graph.getElementsByTagName('ydata')[0].getAttribute('format');
		var xdataArray = xdata.split("#@!");
		var ydataArray = ydata.split("#@!");			
		var ulrArray = url.split("#@!");

		if (xdataArray[0] == "" || xdataArray[0] == " ") {
			barJson = {
				xdata : [],
				ydata : [],
				url : [],
				xlabel : ylb,
				ylabel : xlb,
				limit : limit,
				format : format
			};
		} else {
			barJson = {
				xdata : xdataArray,
				ydata : ydataArray,
				url : ulrArray,
				xlabel : ylb,
				ylabel : xlb,
				limit : limit,
				format : format
			};
		}
	} else if (type == "json") {
			barJson = root;
	} else {
		return "Please specify type";
	}
		
	if (chartType == 1) {				
		barGraph(id, barJson);
	} else if (chartType == 2) {						
		columnbarGraph("" + id, barJson);
	} else if (chartType == 3) {		
		$("#" + id).append("<canvas id=\"can_" + id + "\" width=\"540px\" height=\"600px\" ></canvas>");		
		pieChart(barJson, "can_"+ id);
	}
	div_graph_id=id;
}

	/**	 
 	 * it is use for tooltip. here get mouse position in this variable. 
 	 */
var mousetop,mouseleft;
var div_graph_id="";
$("#"+div_graph_id).on( "mousemove", function( event ) {    
  		mousetop=event.pageY;
  		mouseleft=event.pageX;
});

	/**	 
 	 * it is generate tooltop and animated it 
 	 */
function mytooltipfun(tooltip, tooltipText) {
	tooltipClassName = "tooltip-soft-blue";
	tooltipClass = '.' + tooltipClassName;

	if (tooltip.hasClass('showed-tooltip'))
		return false;
	$(tooltip).append("<div id=\"cloudeTooltip\" class='" + tooltipClassName + "'>" + tooltipText + "</div>");
	//tooltip.addClass('showed-tooltip')
	//	 .after('<div id="cloudeTooltip" class="'+tooltipClassName+'">'+tooltipText+'</div>');

	/*tooltipPosTop = tooltip.position().top - $(tooltipClass).outerHeight() - 10;
	tooltipPosLeft = tooltip.position().left;
	tooltipPosLeft = tooltipPosLeft - (($(tooltipClass).outerWidth() / 2) - tooltip.outerWidth() / 2);
*/
	tooltipPosLeft = mouseleft;
	tooltipPosTop =mousetop;
	
	$(tooltipClass).css({
		'left' : tooltipPosLeft,
		'top' : tooltipPosTop
	}).animate({
		'opacity' : '1',
		'marginTop' : '-20'
	}, 100);
}
	/**	 
 	 * it remove tooltip with animation 
 	 */
function mytooltipremovefun(tooltip) {
	tooltipClassName = "tooltip-soft-blue";
	tooltipClass = '.' + tooltipClassName;
	$(tooltipClass).animate({
		'opacity' : '0',
		'marginTop' : '-10px'
	}, 50, function() {

		$("#cloudeTooltip").remove();
		tooltip.removeClass('showed-tooltip');

	});
}
