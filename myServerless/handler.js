var request = require('request');
var async = require('async');
var AWS = require('aws-sdk');

var docClient = new AWS.DynamoDB.DocumentClient();
var temp;
var data;

AWS.config.update({
    region: "us-west-2"
});

'use strict';

module.exports.hello = (event, context, callback) => {
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*" // Required for CORS support to work
        },
        body: JSON.stringify({
            message: 'Bus info has been updated!'
        })
    };
    async.waterfall([fetchBusInfo, storeIds]);
    callback(null, response);
};

module.exports.queryBusRoutes = (event, context, callback) => {
  temp = callback;
    async.waterfall([retrieveIds, queryBuses]);
    
    //temp = callback;
};

function fetchBusRoutes(callback) {
  console.log("fetching data");
    var counter = 0;
    request('https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var jsonArray = JSON.parse(response.body);
            var ids = [];
            var params;

            for (var i in jsonArray) {
                ids.push(jsonArray[i].id);
                params = {
                    TableName: "updated-table",
                    Item: {
                        "id": jsonArray[i].id,
                        "timestamp": new Date().getTime(),
                        "logo": jsonArray[i].logo,
                        "lat": jsonArray[i].lat,
                        "lng": jsonArray[i].lng,
                        "route": jsonArray[i].route
                    }
                };
                docClient.put(params, function(err, data) {
                    if (err) {
                        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                        callback(JSON.stringify(err));
                    } else {
                        console.log("Added item:", JSON.stringify(data, null, 2));
                        counter++;
                        if (counter == jsonArray.length) {
                            callback(null, ids);
                        }
                    }
                });
            }
        }
    });
}

function storeIds(idArray, callback) {
    console.log(idArray);
    var count = 0;
    for (i in idArray) {

        var params = {
            TableName: "bronco-mapper",
            Item: {
                "primarykey": idArray[i]
            }
        };

        docClient.put(params, function(err, data) {
            if (err) {
                console.log("error scanning the table!");
            } else {
                count++;
                if (count == idArray.length) {
                    callback(null);
                }
            }


        });
    }
}

function retrieveIds(callback){
  console.log("beginning scan");
  var tableIds = [];

  var params = {
    TableName : "bronco-mapper"
  };

    docClient.scan(params, function(err, data) {
      if(err){
        console.log("error scanning the table!");
      }
      else{
        for(var i in data.Items){
          //ids in tableIds
          tableIds.push(data.Items[i].id);
        }
        callback(null, tableIds);
      }
    });
}

function queryBuses(ids, callback){
  var result = [];
  async.each(ids, function(id, callback2){
    var params = {
      TableName : "updated-table", 
      KeyConditionExpression : "#primarykey = :primarykey",
      ExpressionAttributeNames : {
        "#primarykey" : "primarykey"
      },
      ExpressionAttributeValues : {
        ":id" : id
      },
      ScanIndexForward : "true",
      Limit : 1
    };
    
    docClient.query(params, function(err, data){
      if(err){
        console.log("error");
      }
      else{
        var item = data.Items[0];
        var obj = {
          id : item.id,
          logo : item.logo,
          lat : item.lat,
          lng : item.lng,
          route : item.route
        };
        result.push(obj);
        callback2();
      }
    });
  }, function(err){
    if(err) {
      console.log("something bad happened");
    } 
    else{
      console.log("Result from queries: ")
      console.log(result);
      data = result;
      console.log("attempting to send response through call back : " + data);
      var response = {
          statusCode : 200,
          headers: {
                  "Access-Control-Allow-Origin" : "*" // Required for CORS support to work
          },
          body : JSON.stringify(data)
      }
      temp(null, response);
    }
  });
}