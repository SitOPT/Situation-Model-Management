/**
 * Created by armin on 13.09.16.
 */
var http = require('http');

module.exports = {
    deleteRecognition: function (req, res) {
        var id = req.swagger.params.id.value;
        var amount = db.collection("recognitions").count({id:id});
        if (amount == 0) {
            res.statusCode = 404;
            res.json({message:"stuff"});
        }
        var cursor = db.collection("recognitions").find({id:id});
        cursor.forEach(function (elem) {
            for (var i = callbackArray.length - 1; i >= 0; i--) {
                var e = callbackArray[i];
                if (e.ThingID == elem.thing && e.TemplateID == elem.template) {
                    callbackArray.splice(i, 1);
                }
            }
            db.collection("recognitions").deleteOne(elem);
        });
        res.json({message:"deleted"});
    },

    getRecognitions: function (req, res) {
        var cursor = db.collection("recognitions").find({});
        var array = [];
        cursor.forEach(function (elem) {
            array.push(elem);
        }, function () {
            res.json(array);
        });
    },

    postRecognition: function (req, res) {
        var recognition = req.swagger.params.recognition.value;
        recognition.timestamp = new Date().getTime();
        db.collection("recognitions").count({thing:recognition.thing, template:recognition.template}, function (error, count) {
            if (count < 1) {
                db.collection("recognitions").insertOne(recognition);
            }
        });
        res.json({message: "ok"});
    }
};