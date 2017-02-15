	var request = require('request');
	var AWS = require('aws-sdk');

	var express = require('express')
	var app = express()

	AWS.config.update({
	  region: "us-west-2"
	});

	var docClient = new AWS.DynamoDB.DocumentClient();
	var table = "bronco-mapper";

	function fetchBusRoutes() {
		request('https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info', function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		  	var arr = JSON.parse(body);
		  	for (var i = 0; i < arr.length; ++i){
		  		var bus_id = arr[i].id;
		  		var params = {
				    TableName: "bronco-mapper",
				    Item:{
				        "primarykey": arr[i].id,
				        "timestamp": Date.now(),
				        "info":{
				            "logo": arr[i].logo,
				            "lat": arr[i].lat,
				            "lng": arr[i].lng,
				            "route":arr[i].route
				        }
				    }
				};
			
			  	docClient.put(params, function(err, data) {
	       			if (err) {
	           			console.error("Unable to add bus", params.Item.primarykey, ". Error JSON:", JSON.stringify(err, null, 2));
	       			} else {
	           			console.log("PutItem succeeded: ", params.Item.primarykey);
	       			}
	    		});
		  	} 
		 //    parseString(body, function (err, result) {
			//     // console.dir(result.rss.channel[0].item);
			//     var items = result.rss.channel[0].item;
			//     for(var i = 0; i < items.length; i++) {
			//     	console.log(items[i].title[0], items[i].description[0]);
			//     	//putItem(items[i].title[0], items[i].description[0]);
			//     }
			// });
		  }
		})
	}

	app.get('/fetch', function(req, res) {
		fetchBusRoutes();
	})
/**
	function fetchWaitingtimes() {
		request('https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info', function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    // console.log(body);
			parseString(body, function (err, result) {
			    // console.dir(result.rss.channel[0].item);
			    var items = result.rss.channel[0].item;
			    for(var i = 0; i < items.length; i++) {
			    	console.log(items[i].title[0], items[i].description[0]);
			    	putItem(items[i].title[0], items[i].description[0]);
			    }
			});
		  }
		})
	}

	function putItem(rideName, waittime) {
		var params = {
		    TableName:table,
		    Item:{
		        "rideName": rideName,
		        "timestamp": Date.now(),
		        "waittime": waittime
		    }
		};

		console.log("Adding a new item...");
		docClient.put(params, function(err, data) {
		    if (err) {
		        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
		    } else {
		        console.log("Added item:", JSON.stringify(data, null, 2));
		    }
		});
	}

	function queryWaitingtime(rideName, res) {
		var params = {
		    TableName : table,
		    KeyConditionExpression: "#key = :inputName",
		    ExpressionAttributeNames:{
		        "#key": "rideName"
		    },
		    ExpressionAttributeValues: {
		        ":inputName":rideName
		    }
		};

		docClient.query(params, function(err, data) {
		    if (err) {
		        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
		    } else {
		        console.log("Query succeeded.");
		        data.Items.forEach(function(item) {
		            console.log(item);
		        });
		        res.send(data.Items);
		    }
		});	
	}

	app.get('/fetch', function (req, res) {
		fetchWaitingtimes();
	  	res.send('OK');
	})

	app.get('/query', function (req, res) {
		queryWaitingtime(req.query.name, res);	
	})
**/
	app.listen(3000, function () {
	  console.log('Listening on port 3000!')
	})
	