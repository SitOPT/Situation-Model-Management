
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var assert = require('assert');

app.use(bodyParser());



//exporting modules to swagger editor
module.exports = {
  allSensors: allSensors,
  saveSensor: saveSensor,
  getSensorByName: getSensorByName,
  deleteSensor: deleteSensor
};


function deleteSensorFromThing(sensorName, thingName) {
	var cursor = db.collection('Things').find({name: thingName, sensors: sensorName});
	cursor.forEach(function (thing) {
		thing.sensors.splice(thing.sensors.indexOf(sensorName), 1);
		db.collection('Things').updateOne({"_id": thing._id}, thing);
	})
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
//deleteSensorByID
//
//Deletes specified sensor
//Returns 404 if situation is not found
/////////////////////////////////////////////////////////////////////////////////////////////////////
function deleteSensor(req, res){
	removeDocument(req.swagger.params.name.value, req.swagger.params.thing.value, function(items) {
		if (items.deletedCount > 0) {
			deleteSensorFromThing(req.swagger.params.name.value, req.swagger.params.thing.value);
			res.json({name: "Deleted"});
		} else {
			res.statusCode = 404;
			res.json({message: "Not Found"});
		}
	});
}
function removeDocument(id, thing, callback) {
   db.collection('Sensors').deleteOne(
      {
		  "name": id,
		  "thing": thing
	  },
      function(err, results) {
         callback(results);
      }
   );
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
//getSensorByname
//
//Returns array of documents filtered by name
//Returns 404 if sensor is not found
/////////////////////////////////////////////////////////////////////////////////////////////////////
function getSensorByName(req, res) {
	queryName(req.swagger.params.name.value, req.swagger.params.thing.value, function(array){
		if (array.length > 0) {
			res.json(array[0]);
		} else {
			res.statusCode = 404;
			res.json({message: "Not Found"})
		}
	});
}
function queryName(name, thing, callback){
	var array = [];
	var cursor = db.collection('Sensors').find( { "name": name, "thing": thing  } );
   	cursor.each(function(err, doc) {
      	assert.equal(err, null);
      	if (doc != null) {
         	array.push(doc);
      	}else{
      		callback(array);
      	}
   	});
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
//allSensors
//
//Returns array of all sensors
/////////////////////////////////////////////////////////////////////////////////////////////////////
function allSensors(req, res) {
	getAllSensors(function(allSensors) {
	    res.json(allSensors);
	});
}
function getAllSensors(callback) {
   var cursor =db.collection('Sensors').find( );
   var array = [];
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         array.push(doc);
      } else {
         callback(array);
      }
   });
};


function updateThing(document) {
	db.collection('Things').find({name: document.thing}).count(function (error, count) {
		if (error != null) {
			console.trace(error.message)
		} else if (count == 0) {
			db.collection('Things').insertOne({
				name: document.thing,
				sensors: [document.name],
				owners: []
			});
		} else {
			var cursor = db.collection('Things').find({name: document.thing});
			cursor.forEach(function (thing) {
				if (thing.sensors.indexOf(document.name) == -1) {
					thing.sensors.push(document.name);
					db.collection('Things').updateOne({"_id": thing._id}, thing);
				}
			})
		}
	});
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
//saveSensor
//
//Stores sensor in CouchDB
/////////////////////////////////////////////////////////////////////////////////////////////////////
function saveSensor(req, res){
	var document = req.swagger.params.body.value;
	queryName(document.name, document.thing, function (array) {
		if (array.length == 0) {
			updateThing(document);
			db.collection('Sensors').insertOne({
				"ObjectType": "Sensor",
				"SensorType": document.SensorType,
				"name": document.name,
				"url": document.url,
				"quality": document.quality,
				"description": document.description,
				"timestamp": (new Date).getTime(),
				"thing": document.thing
			}, function (err, result) {
				assert.equal(err, null);
				//console.log(result);
				res.json({message: JSON.stringify(result)});
			});
		} else {
			res.statusCode = 400;
			res.json({message: 'name already exists'});
		}
	});
}


