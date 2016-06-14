"use strict";

let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
let fs = require("fs");
let papa = require("papaparse");

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
		socket.emit("deliverFood", fridgeList);
	})
	socket.on("newItem", newItem => {
		fridgeList.push(newItem);
		let csv = papa.unparse(fridgeList);
		fs.writeFile('fridgeData.txt', csv, function (err) {
		    if (err) 
		        return console.log(err);
		    console.log('Fridge saved');
		});
	})
	socket.on("removeItem", removableItem => {
		var itemIndex = fridgeList
			.map(item => item.index)
			.indexOf(removableItem);
		if(itemIndex >= 0){
			fridgeList.splice(itemIndex, 1);
		}
	})
})
