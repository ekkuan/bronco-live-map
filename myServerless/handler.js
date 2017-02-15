var request = require('request');
var AWS = require('aws-sdk');

AWS.config.update({
  region: "us-west-2"
});

var docClient = new AWS.DynamoDB.DocumentClient();
var table = "bronco-mapper";

'use strict'; 

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Updated Bus Route information!'
    }),
  };

  fetchBusRoutes();
  callback(null, response);  
};

module.exports.queryBusRoutes = (event, context, callback) => {  
  queryWaitingtime(event.pathParameters.name, callback);
};

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
    }
  })
};

function queryBusRoutes(primarykey, callback) {
  var params = {
    TableName : table,
    KeyConditionExpression: "#key = :inputName",
    ExpressionAttributeNames:{
      "#key": "primarykey"
    },
    ExpressionAttributeValues: {
      ":inputName":primarykey
    }
  };

  docClient.query(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));      
      if (callback) {
        const responseErr = {
          statusCode: 500,
          body: JSON.stringify({'err' : err}),
        };
        callback(null, responseErr);  
      }
    } else {
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
  });
}
