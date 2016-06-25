"use strict";

let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
let fs = require("fs");
let papa = require("papaparse");

let mongo = require("mongodb").MongoClient;
let url = "mongodb://localhost:27017/bestbefore";

app.use(express.static(__dirname));

app.get("/", (req, res) => {
	console.log("I'm connected")
	res.sendFile(__dirname + "/index.html");
});
http.listen(7000, function(){
	console.log("Listening to port 7000!")
});

let globalIndex = 0;


function FoodItem(name, date){
	this.name = name;
	this.date = date.toDateString();
	this.index = globalIndex++;
}

let fridgeList = [];
fs.readFile('fridgeData.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  let tempFridgeList = [];
  papa.parse(data, {
  	header: true,
  	step: row => {
  		tempFridgeList.push(row.data[0]);
  	}});
  fridgeList = tempFridgeList;
});



fridgeList = [new FoodItem("mjölk", new Date(2016, 6, 17))
, new FoodItem("lax", new Date(2016, 7, 3))
, new FoodItem("skalbaggar", new Date(2017, 1, 26))];


io.on("connection", socket => {
	socket.on("fetchFood", now => {
		mongo.connect(url, (err, db) => {
			let collection = db.collection("products");
			collection.find().toArray((err, documents) => {
					if(err) throw err;
					socket.emit("deliverFood", documents);
					console.log(documents);
					db.close();
				});
		})
	})
	socket.on("newItem", newItem => {
		console.log("here comes newItem:")
		console.log(newItem);
		/*fridgeList.push(newItem);
		let csv = papa.unparse(fridgeList);
		fs.writeFile('fridgeData.txt', csv, function (err) {
		    if (err) 
		        return console.log(err);
		    console.log('Fridge saved');
		});*/
		mongo.connect(url, (err, db) => {
			if (err) throw err;
			let collection = db.collection("products");
			collection.insert(newItem, (err, data) => {
				if(err) throw err;
				console.log(data);
				db.close();
			});
		})
	})
	socket.on("removeItem", removableItem => {
		mongo.connect(url, (err, db) => {
			let collection = db.collection("products");
			console.log(removableItem);
			collection.remove({
				//ändra till inputTime
				inputTime: removableItem
			})
		})
		var itemIndex = fridgeList
			.map(item => item.index)
			.indexOf(removableItem);
		if(itemIndex >= 0){
			fridgeList.splice(itemIndex, 1);
		}
	})
})
