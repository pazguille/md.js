// setInterval(function () {console.log(Math.round(Math.random() * 4)+1)}, 500);
(function () {

	var webcamError = function(e) {
		alert('Webcam error!', e);
	};

	var video = document.querySelector('#webcam'),
		circle = document.querySelector('#circle');

	navigator.webkitGetUserMedia({audio: false, video: true}, function(stream) {
		video.src = window.webkitURL.createObjectURL(stream);
		start();
	}, webcamError);

	var lastImageData,
		canvasSource = document.querySelector("#canvas-source"),
		canvasBlended = document.querySelector("#canvas-blended"),
		contextSource = canvasSource.getContext('2d'),
		contextBlended = canvasBlended.getContext('2d');

	// mirror video
	contextSource.translate(canvasSource.width, 0);
	contextSource.scale(-1, 1);

	function start() {
		drawVideo();
		blend();
		checkAreas();
		webkitRequestAnimationFrame(start);
	}

	function drawVideo() {
		contextSource.drawImage(video, 0, 0, video.width, video.height);
	}

	function blend() {
		var width = canvasSource.width,
			height = canvasSource.height,
			blendedData,
			// get webcam image data
			sourceData = contextSource.getImageData(0, 0, width, height);

		// create an image if the previous image doesn’t exist
		if (!lastImageData) lastImageData = contextSource.getImageData(0, 0, width, height);

		// create a ImageData instance to receive the blended result
		blendedData = contextSource.createImageData(width, height);

		// blend the 2 images
		differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);

		// draw the result in a canvas
		contextBlended.putImageData(blendedData, 0, 0);

		// store the current webcam image
		lastImageData = sourceData;
	}

	function fastAbs(value) {
		// funky bitwise, equal Math.abs
		return (value ^ (value >> 31)) - (value >> 31);
	}

	function threshold(value) {
		return (value > 0x15) ? 0xFF : 0;
	}

	function difference(target, data1, data2) {
		// blend mode difference
		if (data1.length != data2.length) return null;
		var i = 0;
		while (i < (data1.length * 0.25)) {
			target[4*i] = data1[4*i] == 0 ? 0 : fastAbs(data1[4*i] - data2[4*i]);
			target[4*i+1] = data1[4*i+1] == 0 ? 0 : fastAbs(data1[4*i+1] - data2[4*i+1]);
			target[4*i+2] = data1[4*i+2] == 0 ? 0 : fastAbs(data1[4*i+2] - data2[4*i+2]);
			target[4*i+3] = 0xFF;
			++i;
		}
	}

	function differenceAccuracy(target, data1, data2) {
		if (data1.length != data2.length) return null;
		var i = 0;
		while (i < (data1.length * 0.25)) {
			var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
			var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
			var diff = threshold(fastAbs(average1 - average2));
			target[4*i] = diff;
			target[4*i+1] = diff;
			target[4*i+2] = diff;
			target[4*i+3] = 0xFF;
			++i;
		}
	}

	function checkAreas() {
		var blendedData = contextBlended.getImageData(circle.offsetLeft, circle.offsetTop, circle.offsetWidth, circle.offsetHeight),
			i = 0,
			average = 0;

		// loop over the pixels
		while (i < (blendedData.data.length * 0.25)) {
			// make an average between the color channel
			average += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
			i += 1;
		}
		// calculate an average between of the color values of the note area
		average = Math.round(average / (blendedData.data.length * 0.25));

		// over a small limit, consider that a movement is detected
		if (average >= 1) {
			console.log("move!");
			//circle.style.webkitTransform = "translate(" + (Math.round(Math.random() * 440) + 1) + "px," + (Math.round(Math.random() * 280) + 1) + "px)";
			circle.style.left = (Math.round(Math.random() * 440) + 1) + "px";
			circle.style.top = (Math.round(Math.random() * 280) + 1) + "px";
		}
	}
})();