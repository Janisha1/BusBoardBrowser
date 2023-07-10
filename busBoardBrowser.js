// Packages

// Fetching Data
async function fetchData(url) {
	try {
		const dataResponse = await fetch(url);
		if (!dataResponse.ok) {
			throw new Error(
				`Error occured in request. Status code ${dataResponse.status}`
			);
		} else {
			const returnData = await dataResponse.json();
			return returnData;
		}
	} catch (err) {
		console.error(`Error in ${url}.`, err);
	}
}

function displayErrorMessage(errMessage) {
	const errorBanner = document.getElementById("errorBanner");
	errorBanner.innerHTML = "";
	const errorMessage = document.createElement("p");
	errorMessage.innerText = errMessage;
	errorBanner.appendChild(errorMessage);
}

function clearErrorMessages() {
	const errorBanner = document.getElementById("errorBanner");
	errorBanner.innerHTML = "";
}

async function getArrivalsAtStopPoint(id) {
	const arrivalsData = await fetchData(
		`https://api.tfl.gov.uk/StopPoint/${id}/Arrivals`
	);
	return arrivalsData;
}

function getUserInput(userInputID) {
	const userInput = document.getElementById(userInputID);
	const userPostcode = userInput.value.toUpperCase();
	console.log("postcode check result: " + checkValidPostcode(userPostcode));
	const userPostcodeValid = checkValidPostcode(userPostcode);
	// if (!checkValidPostcode(userPostcode)) {
	// 	displayErrorMessage("Invalid Postcode. Please fix and resubmit");
	// }

	return { postcode: userPostcode, isValid: userPostcodeValid };
}

function checkValidPostcode(postcode) {
	var regex = /^([A-Z]{1,2}[0-9]{1,2}[A-Z]? ?[0-9][A-Z]{2})$/g;
	return regex.test(postcode);
}

async function postcodeToLatLng(postcode) {
	const locationData = await fetchData(
		`http://api.postcodes.io/postcodes/${postcode}`
	);
	const latitude = locationData.result.latitude;
	const longitude = locationData.result.longitude;
	return { latitude, longitude };
}

async function displayArrivals(arrivals, stopName, arrivalsList) {
	const numOfArrivalsToDisplay = Math.min(arrivals.length, 5);
	console.log(`Bus stops for a ${stopName}`);
	for (let i = 0; i < numOfArrivalsToDisplay; i++) {
		const arrival = arrivals[i];
		const arrivalListItem = document.createElement("li");
		arrivalListItem.innerText = `Bus ${arrival.lineId} arriving in ${arrival.timeToStation} seconds`;
		arrivalsList.appendChild(arrivalListItem);
		console.log(
			`  Bus ${arrival.lineId} arriving in ${arrival.timeToStation} seconds`
		);
	}
}

async function getNearestBusStops(latitude, longitude) {
	// API call using lat,lng & radius
	const radius = 1000;
	const stopPointsData = await fetchData(
		`https://api.tfl.gov.uk/StopPoint/?lat=${latitude}&lon=${longitude}&stopTypes=NaptanPublicBusCoachTram&radius=${radius}`
	);

	// Sorted the data array
	const stopPoints = stopPointsData.stopPoints;
	stopPoints.sort(
		(stopPointA, stopPointB) => stopPointA.distance - stopPointB.distance
	);

	// Filtered the array for relevant information
	return stopPoints.map((stopPoint) => {
		return {
			id: stopPoint.naptanId,
			distance: stopPoint.distance,
			stopName: stopPoint.commonName,
		};
	});
}

async function displayBusBoard(nearestBusStops) {
	const liveBusArrivals = document.getElementById("liveBusArrivals");
	// liveBusArrivals.innerHTML = "";

	if (nearestBusStops.length === 0) {
		console.log("No buses found near you. Start walking");
		const noBusesMessage = document.createElement("h3");
		noBusesMessage.innerText = "No buses found near you. Start walking";
		liveBusArrivals.appendChild(noBusesMessage);
		return;
	}

	// Show the busBoard
	for (let i = 0; i < 2 && i < nearestBusStops.length; i++) {
		// Bus Stop Heading
		const busStopName = nearestBusStops[i].stopName;
		const busStopHeading = document.createElement("h3");
		busStopHeading.innerText = busStopName;
		liveBusArrivals.appendChild(busStopHeading);

		// Bus Stop Arrivals
		const arrivalsList = document.createElement("ul");
		const arrivalsData = await getArrivalsAtStopPoint(
			nearestBusStops[i].id
		);
		displayArrivals(
			arrivalsData,
			nearestBusStops[i].stopName,
			arrivalsList
		);
		liveBusArrivals.appendChild(arrivalsList);
	}
}

function clearBusBoard() {
	const liveBusArrivals = document.getElementById("liveBusArrivals");
	liveBusArrivals.innerHTML = "";
}

async function getJourneys(startPostcode, endPostcode) {
	// fetch data
	const getJourneyPlanData = await fetchData(
		`https://api.tfl.gov.uk/Journey/JourneyResults/${startPostcode}/to/${endPostcode}`
	);

	// sort by time?
	const journeys = getJourneyPlanData.journeys;
	journeys.sort(
		(journeyA, journeyB) => journeyA.duration - journeyB.duration
	);

	// Map for required data to display
	return journeys.map((journey) => {
		return {
			startDateTime: journey.startDateTime,
			duration: journey.duration,
			arrivalDateTime: journey.arrivalDateTime,
			legs: journey.legs,
		};
	});
}

function displayJourneys(journeysData) {
	const journeyPlanner = document.getElementById("journeyPlanner");
	// journeyPlanner.innerHTML = "";

	if (journeysData.length === 0) {
		const noJourneyMessage = document.createElement("h3");
		noJourneyMessage.innerText = "No Journeys Found for that Route";
		journeyPlanner.appendChild(noJourneyMessage);
		return;
	}

	for (let i = 0; i < 3 && i < journeysData.length; i++) {
		// Heading
		const journeyHeading = document.createElement("h3");
		journeyHeading.innerText = `Journey Option ${i + 1}`;
		journeyPlanner.appendChild(journeyHeading);

		const journeyData = journeysData[i];

		// Journey Summary
		const journeySummary = document.createElement("p");
		journeySummary.innerHTML = `<p>Duration: ${journeyData.duration}</p><p>Start Time: ${journeyData.startDateTime}</p><p>End Time: ${journeyData.arrivalDateTime}</p>`;
		journeyPlanner.appendChild(journeySummary);

		// Legs
		const journeyLegs = document.createElement("ul");
		journeyData.legs.forEach((leg) => {
			const legSummary = document.createElement("li");
			legSummary.innerText = leg.instruction.summary;
			journeyLegs.appendChild(legSummary);
		});
		journeyPlanner.appendChild(journeyLegs);
	}
}

function clearDisplayedJourneys() {
	const journeyPlanner = document.getElementById("journeyPlanner");
	journeyPlanner.innerHTML = "";
}

function clearDisplays(){
	clearErrorMessages();
	clearBusBoard();
	clearDisplayedJourneys();
}

async function getBusBoard() {
	clearDisplays();
	// User postcode conversion
	//	const userPostcode = getUserInput();
	const userPostcode = getUserInput("userPostCodeInput");

	if (userPostcode.isValid) {
		const userLocation = await postcodeToLatLng(userPostcode.postcode);
		console.log(
			`\nuser location:\nlat: ${userLocation.latitude} , long: ${userLocation.longitude}\n`
		);

		// Find Nearest StopPoints
		const nearestBusStops = await getNearestBusStops(
			userLocation.latitude,
			userLocation.longitude
		);

		// Display the arrivals board
		displayBusBoard(nearestBusStops);
	} else {
		displayErrorMessage(
			"Invalid Postcode for BusBoard. Please fix and resubmit"
		);
	}
}

/* Plan a journey function */
async function getJourneyPlanner() {
	clearDisplays();

	// get start from and end at locations
	// console.log("I'm in the journey planner function");

	const startPostcode = getUserInput("journeyStartFrom");
	const endPostcode = getUserInput("endJourneyAt");
	// console.log(`${startPostcode} , end at ${endPostcode}`);

	// Make Journey Planner API call
	if (startPostcode.isValid && endPostcode.isValid) {
		const journeysData = await getJourneys(
			startPostcode.postcode,
			endPostcode.postcode
		); 
		// Display journey to User
		displayJourneys(journeysData);
	} else {
		displayErrorMessage("Invalid postcode in requested journey");
	}
}
