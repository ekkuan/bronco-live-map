var request = require('request');
var AWS = require('aws-sdk');

AWS.config.update({
  region: "us-west-2"
});

var docClient = new AWS.DynamoDB.DocumentClient();
var table = "bronco-mapper";
var table2 = "updated-table";

'use strict'; 

module.exports.hello = (event, context, callback) => {  //Lambda function 
  const response = {                                    
    statusCode: 200,
    headers: {
        "Access-Control-Allow-Origin" : "*"
    },
    body: JSON.stringify({
      message: 'Updated Bus Route information!'
    }),
  };

  fetchBusRoutes();
  callback(null, response);  
};

module.exports.queryBusRoutes = (event, context, callback) => {  
  queryBusRoutes(callback);
};

function fetchBusRoutes() {
  request('https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var arr = JSON.parse(body);
      for (var i = 0; i < arr.length; ++i){
        var bus_id = arr[i].id;
        var params = {
          TableName: table,
          Item:{
              "primarykey": arr[i].id,
              "timestamp": Date.now(),
              "info":{
                  "logo": arr[i].logo,
                  "lat": arr[i].lat,
                  "lng": arr[i].lng,
                  "route": arr[i].route
              }
          }
        };

        var params2 = {
          TableName: table2,
          Item:{
              "primarykey": arr[i].id,
              "timestamp": Date.now(),
              "info":{
                  "logo": arr[i].logo,
                  "lat": arr[i].lat,
                  "lng": arr[i].lng,
                  "route": arr[i].route
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

        docClient.update(params2, function(err, data) {
            if (err) {
                console.error("Unable to add bus", params.Item.primarykey, ". Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("PutItem succeeded: ", params.Item.primarykey);
            }
        });
      } 
    }
  })
};

function queryBusRoutes(callback) {
  var params = {
    TableName : table2,
    ProjectionExpression: "#primarykey, timestamp, info.logo, info.lat, info.lng, info.route"
  };

  console.log("Scanning Bus routes.");
  docClient.scan(params, onScan);

  function onScan(err, data) {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          // print all the movies
          console.log("Scan succeeded.");
              {
                data.Items.forEach(function(item) {
                  console.log(item);
                });
                if (callback) {
                  const responseOk = {
                    statusCode: 200,
                    body: JSON.stringify(data.Items),
                  };
                  callback(null, responseOk);  
                }
              }
          // continue scanning if we have more bus id
          if (typeof data.LastEvaluatedKey != "undefined") {
              console.log("Scanning for more...");
              params.ExclusiveStartKey = data.LastEvaluatedKey;
              docClient.scan(params, onScan);
          }
      }
  }                           
};


