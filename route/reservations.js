var db = require('../config/mongo_database');
var moment = require('moment');

exports.getAll = function(req, res) {
	var dateNow = new Date();
	var twoMonthsBefore = moment(dateNow).subtract(2, 'M').toDate();
	var twoMonthsAfter = moment(dateNow).add(2, 'M').toDate();
	
	var query = db.reservationModel.find(
	{$or: [
		{
			"reservation":
			{
				$gte: dateNow,
				$lt: twoMonthsAfter
			}
		},
		{
			"reservation":
			{
				$gte: twoMonthsBefore,
				$lt: dateNow
			}
		}
		]
	});
	
	query.exec(function(err, result) {
		if (err) {
			console.log(err);
			return res.sendStatus(400);
		}
		
		if (result != null) {
			return res.status(200).json(result);
		} else {
			return res.sendStatus(400);
		}
	});
};

exports.create = function(req, res){
	var reservation = req.body;
	
	if (reservation == null || reservation.firstname == null || reservation.lastname == null
	 || reservation.reservationDate == null || reservation.reservationTime == null
	 || reservation.firstname == "" || reservation.lastname == ""
	 || reservation.reservationDate == "" || reservation.reservationTime == "") {
		return res.sendStatus(400);
	}
	
	var validateDate = validateDateValue(reservation.reservationDate);
	var validateTime = validateTimeValue(reservation.reservationTime);
	
	if (validateDate || validateTime) {
		return res.sendStatus(400);
	}
	
	//Validate date and time according to format
	if (!moment(reservation.reservationDate+" "+reservation.reservationTime, "YYYY-MM-DD HH:mm").isValid()) {
		return res.sendStatus(400);
	}
	
	var reservationModel = new db.reservationModel();
	reservationModel.firstname = decodeURIComponent(reservation.firstname);
	reservationModel.lastname = decodeURIComponent(reservation.lastname);
	
	var reservationDate = new Date(reservation.reservationDate+" "+reservation.reservationTime);
	reservationModel.reservation = reservationDate;//new Date('2020-04-20 15:20') works
	
	reservationModel.save(function(err, result) {
		if (err) {
			return res.sendStatus(400);
		}
		
		return res.sendStatus(200);
	});
};

function validateDateValue(newValue) {
	var showError = false;
	
	if (newValue == "") {
		showError = true;
	}else{
		// Workaround for checking date - as you can type manually date
		var checkTime = newValue.split("-");
		// Hour:Minutes - so should be only two values
		if (checkTime.length == 3) {
			var year = parseInt(checkTime[0]);
			var month = parseInt(checkTime[1]);
			var day = parseInt(checkTime[2]);
			
			var todayDate = getTodayTime();
			
			if (todayDate.year <= year) {
				if (todayDate.month > month) {
					showError = true;
				}else{
					//If it is same month - but day is less than today - show error
					if (todayDate.month == month && todayDate.day > day) {
						showError = true;
					}
				}
			}else{
				showError = true;
			}
		}else{
			showError = true;
		}
	}
	
	return showError;
}

function getTodayTime() {
	var today = new Date();
	var dd = today.getDate();
	var MM = today.getMonth() + 1;
	var yyyy = today.getFullYear();
	
	return { day: dd, month: MM, year: yyyy };
}

function validateTimeValue(newValue) {
	var showError = false;
	
	if (newValue == "") {
		showError = true;
	}else{
		// Workaround for checking time (as I did not found setting between hours frame setting in TimePicker)
		var checkTime = newValue.split(":");
		// Hour:Minutes - so should be only two values
		if (checkTime.length == 2) {
			var hour = parseInt(checkTime[0]);
			// Assume that: From 8 to 17 hour working
			if (!(hour > 7 && hour < 17)) {
				showError = true;
			}
		}else{
			showError = true;
		}
	}
	
	return showError;
}