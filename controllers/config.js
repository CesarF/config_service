var mongoose = require('mongoose');
var Config  = mongoose.model('Config');
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');
var request = require('request');
var https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

exports.loadData = function (req, res) {
    generateJsonValidColumns()
  //  generateJsonValidColumns();
    res.send({
       success: true,
    });
}

exports.getModel = function(req, res){
  Config.findOne({'id_config': 2 },function (error, config) {
     if (!config.model_id||config.model_id==0) {
        getModels(function(last_model){
          res.send({
             model:last_model.id
          });
        });
     }else{
        res.send({
           model: config.model_id
        });
     }
  });
}

exports.configData = function (req, res) {
    var allData;
    var configdata;
    Config.findOne({'id_config': 1 },'header',function (error, response) {
      console.log(response)
      allData = response;
      Config.findOne({'id_config': 2 },'header',function (error, response) {
        console.log(response)
        configdata = response;
        res.send({
            success: true,
            all:allData.header,
            config:configdata.header
        });
      });
    });
}

exports.modifyData = function (req, res) {
    Config.findOneAndUpdate(
      { 'id_config': 2 },
      { 'header': req.params.columns, 'dataset_id': req.params.dataset_id },
      { new: true, upsert: true },
      function(err) {
        if(err) return res.send(500, err.message);
        res.status(200);
        res.send({
            success: true,
            header: req.params.columns,
            dataset_id: req.params.dataset_id
        });
      });
}

function generateJsonValidColumns(){
    Config.findOne({'id_config': 1 },'header',function (error, response) {
       var json = []
       var allColumns = response.header.split(",")
       Config.findOne({'id_config': 2 },'header',function (error, response) {
          var json = []
          var columns = response.header.split(",")
          allColumns.forEach(function(column){
             var is = columns.indexOf(column)
             var included = false
             if(is>=0)included = true
             json.push({"type":"CATEGORICAL","name":column,"include":included,"imputeOption":"DISCARD"})
          });
          console.log(json)
          postModificarColumnas(json)
       });
    });
}

function postModificarColumnas(jsonBody){
   request({
       url: URL_API+'/api/analyses/8/features', //URL to hit
       method: 'POST',
       json: jsonBody,
       auth: {
           user: 'admin',
           password: 'admin'
       },
       headers: {
           'Content-Type': 'application/json',
           'host': HOST
       }
   }, function(err, response, body){
       if(err) console.log(err);
       else{
           console.log(body);
           console.log("MODIFIQUE COLUMNAS");
           postCrearModelo();
       }
   });
 }

 function postCrearModelo(){
   var jsonBody = { "name": 'executable',  "analysisId": 8, "versionSetId": 48 };
   request({
       url: URL_API'/api/models', //URL to hit
       method: 'POST',
       json: jsonBody,
       auth: {
           user: 'admin',
           password: 'admin'
       },
       headers: {
           'Content-Type': 'application/json',
           'host': HOST
       }
   }, function(err, response, body){
       if(err) console.log(err);
       else{
           console.log(body);
           console.log("CREE MODELO");
           getModels(ejecutarModel)
       }
   });
 }

 function getModels(funct){
   request({
       url: URL_HIT+'/api/models', //URL to hit
       method: 'GET',
       auth: {
           user: 'admin',
           password: 'admin'
       },
       headers: {
           'Content-Type': 'application/json',
           'host': HOST
       }
   }, function(err, response, body){
       if(err) console.log(err);
       else{
           var json = JSON.parse(body)
           var last_model = json[json.length - 1];
           console.log(last_model);
           console.log("MODELOS "+last_model.id);
           Config.findOne({'id_config': 2 },function (error, config) {
              config.model_id = last_model.id;
              config.save();
              funct(last_model)
           });
       }
   });
 }

 function ejecutarModel(model){
   request({
       url: URL_API+'/api/models/'+model.id, //URL to hit
       method: 'POST',
       auth: {
           user: 'admin',
           password: 'admin'
       },
       headers: {
           'Content-Type': 'application/json',
           'host': HOST
       }
   }, function(err, response, body){
       if(err) console.log(err);
       else{
           console.log(body)
           console.log('FINISH')
       }
   });
 }
