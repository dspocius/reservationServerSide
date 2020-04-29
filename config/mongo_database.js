var mongoose = require('mongoose');
var moment = require('moment');
var mongodbURL = 'mongodb://localhost:27017/doctor';
var mongodbOptions = { useUnifiedTopology: true, useNewUrlParser: true };

 mongoose.connect(mongodbURL, mongodbOptions, function (err, res) {
    if (err) { 
        console.log('Connection refused to ' + mongodbURL);
        console.log(err);
    } else {
        console.log('Connection successful to: ' + mongodbURL);
    }
});

var Schema = mongoose.Schema;
var resModel = {};
/*Custom data here*/
var reservationSchema = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    reservation: { type: Date, required: true, unique: true }
});

reservationSchema.pre('save', function (next) {
	var self = this;
	
	var mondayDay = new Date(self.reservation);
	var sundayDay = new Date(self.reservation);
	
	var whichDay = mondayDay.getDay();//0 - 6 starting Sunday
	var getMonthDay = mondayDay.getDate()// 1-31 day of month
	
	//We need to check that user can register once a week on the same week
	mondayDay.setDate(getMonthDay - (whichDay - 1));
	sundayDay.setDate(getMonthDay + (7 - whichDay));
	
	var checkMinutesAfter = moment(self.reservation).add(20, 'm').toDate();
	var checkMinutesBefore = moment(self.reservation).subtract(20, 'm').toDate();
	//We need to check if user already registered this week and also:
	//We need to check before 20min and after 20minutes if doctor will be available that time
	resModel.reservationModel.find(
	{
		$or: [
		{"reservation": 
		{
			$gte: mondayDay,
			$lt: sundayDay
		},
			"firstname": self.firstname,
			"lastname": self.lastname
		},
		{
			"reservation":
			{
				$gte: self.reservation,
				$lt: checkMinutesAfter
			}
		},
		{
			"reservation":
			{
				$gte: checkMinutesBefore,
				$lt: self.reservation
			}
		}]
	}, function (err, docs) {
		if (!docs.length){
			next();
		}else{
			next(new Error("AppointmentTaken"));
		}
	});
});

resModel.reservationModel = mongoose.model('Reservation', reservationSchema);
exports.reservationModel = resModel.reservationModel;
