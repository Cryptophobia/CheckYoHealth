// Let's require/import the HTTP module
var http       = require('http');
var express    = require('express');
var bodyParser = require('body-parser');
var _          = require('underscore');
var request    = require('request');
var exec       = require('child_process').exec;
var YAML       = require('yamljs');

var checksJSON = YAML.load('checks.yml');

// Add contains method to the String object
String.prototype.contains = function(it) { 
  return this.indexOf(it) != -1; 
};

// Let's define a port we want to listen to
const PORT=9090;

// Create an instance of Express Server
var server = express();
server.use(bodyParser.urlencoded({ extended: true }));

// Initialize a public folder for front-end libraries and css styles
server.use(express.static(__dirname + '/public'));

server.listen(PORT, function() {
	// Callback triggered when server is successfully listening.
    console.log("Server listening on: http://localhost:%s", PORT);
});


var checkLocalHealth = function(req, res) {
	// Capture the first matching remote IP address from the list.
	var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;

	console.log('Request received from --> ' + ip);
    
  // Setup a check from the application to local host looking at if localhost is primary.
  console.log('Checking local connections...');
	request({
  		url: "http://127.0.0.1", 
  		method: "GET",
	}, function(error, response, body) {
  		if(response == undefined){
  			// Exit function when request body is present. 
  			console.log('Response body was blank.');
  			res.sendStatus(418)
  		}
  		else {
        console.log('Response body has data.');
  			res.sendStatus(200)
  		}
  	});
}

var testYAMLjson = function(req, res){
  //Take yaml file and read it, convert to json object, and return the response
  // Capture the first matching remote IP address from the list.
  var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;

  console.log('Request received from --> ' + ip);

  nativeObject = YAML.load('checks.yml');

  //Do all of the checks here in another function
  //This function will either pass or fail, telling 
  //us which statusCode to send
  console.log(nativeObject)
  res.status(200).send(JSON.stringify(nativeObject))
}

var decideHostOS = function() {
  var theOS = process.platform;
  return theOS;
}

var testDBconnection = function(req, res) {
  //Test the database connections
  var checkOS = process.platform;
  var checkDBs = checksJSON.databases;
  //Windows Commands:
  if(checkOS === 'win32'){
    for(var database in checksJSON.databases){

    }
  }

  //Linux Commands:
  if(checkOS === 'linux'){
    console.log("Number of databases to check: " + checkDBs.length)
    var countUp=0;
    var indexOf=0;
    for(i=0; i < checkDBs.length; i++){
      var cmd = "netcat -zw1 "+checkDBs[i].host.toString()+" "+checkDBs[i].port.toString()+" "+"&& echo \"opened\" || echo \"closed\"";
      console.log(cmd.toString());
      var returned;
      exec(cmd, function(error, stdout, stderr) {
        // command output is in stdout
        var output = stdout;
        if(stdout.contains('closed')){
          returned = 'closed';
          createReturnJSON();
        }
        if(stdout.contains('opened')){
          returned = 'opened';
          createReturnJSON();
        }
        //console.log(stdout);
        //console.log(stderr);
      });
      
      var createReturnJSON = _.after(1, function() {
        if(returned == 'closed'){
        //Set variables in JSON and return
        //console.log(""+checksJSON.databases[indexOf].name.toString()+" "+"connection is closed");
        checksJSON.databases[indexOf].status = "closed";
        if(indexOf == (checksJSON.databases.length-1)){
          sendResponse();
        }
        indexOf++;
        }
        else{
        //Set variables in JSON and return
        //console.log(""+checksJSON.databases[indexOf].name.toString()+" "+"connection is opened");
        checksJSON.databases[indexOf].status = "opened";
        if(indexOf == (checksJSON.databases.length-1)){
          sendResponse();
        }
        indexOf++;
        }
      })
    }

    var sendResponse = _.after(1, function() {
      for(i=0; i < checkDBs.length; i++){
        console.log(checksJSON.databases[i].status);
        if(checksJSON.databases[i].status == 'opened'){
           countUp++
        }
      }
      if(countUp == checkDBs.length){
        res.status(200).send(JSON.stringify(checksJSON.databases, null, 2));
      }
      else{
        res.status(418).send(JSON.stringify(checksJSON.databases, null, 2));
      }
    })
  }
}

var testFiles = function(req, res) {
  //Test the database connections
  var checkOS = process.platform;
  var checkFiles = checksJSON.files;
  var countUp=0;
  //Windows Commands:
  if(checkOS === 'win32'){
    for(var files in checksJSON.files){

    }
  }

  //Linux Commands:
  if(checkOS === 'linux'){
    console.log("Number of files to check: " + checkFiles.length)
    var countUp=0;
    var indexOf=0;
    for(i=0; i < checkFiles.length; i++){
      var cmd = "if test -f " + checkFiles[i].path.toString() +"; then echo \"exist\"; fi";
      console.log(cmd.toString());
      var returned;
      exec(cmd, function(error, stdout, stderr) {
        // command output is in stdout
        var output = stdout;
        if(stdout.contains('exist')){
          returned = 'exists';
          createReturnJSON();
        }
        if(!stdout.contains('exist')){
          returned = 'missing';
          createReturnJSON();
        }
        //console.log(stdout);
        //console.log(stderr);
      });
      
      var createReturnJSON = _.after(1, function() {
        if(returned == 'missing'){
          //Set variables in JSON and return
          checksJSON.files[indexOf].status = "missing";
          if(indexOf == (checksJSON.files.length-1)){
            sendResponse();
          }
          indexOf++;
        }
        else{
          //Set variables in JSON and return
          checksJSON.files[indexOf].status = "exists";
          if(indexOf == (checksJSON.files.length-1)){
            sendResponse();
          }
          indexOf++;
        }
      })
    }

    var sendResponse = _.after(1, function() {
      for(i=0; i < checkFiles.length; i++){
        console.log(checksJSON.files[i].status);
        if(checksJSON.files[i].status == 'exists'){
           countUp++
        }
      }
      if(countUp == checkFiles.length){
        res.status(200).send(JSON.stringify(checksJSON.files, null, 2));
      }
      else{
        res.status(418).send(JSON.stringify(checksJSON.files, null, 2));
      }
    })
  }
}

var testCommands = function(req, res) {
  //Test the database connections
  var checkOS = process.platform;
  var checkCommands = checksJSON.commands;
  var countUp=0;
  //Windows Commands:
  if(checkOS === 'win32'){
    //for(var files in checksJSON.commands){

    //}
  }

  //Linux Commands:
  if(checkOS === 'linux'){
    console.log("Number of commands to check: " + checkCommands.length)
    var countUp=0;
    var indexOf=0;
    var searchStringCount=0;
    for(i=0; i < checkCommands.length; i++){
      var cmd = "" + checkCommands[i].command.toString() +"";
      console.log(cmd.toString());
      var returned;
      exec(cmd, function(error, stdout, stderr) {
        // command output is in stdout
        var searchString = checkCommands[searchStringCount].searchstring.toString();
        var output = stdout.toString();
        console.log("Comparing this: "+output+" to this: "+searchString);
        console.log(searchStringCount);
        if(stdout.contains(searchString)){
          returned = 'true';
          searchStringCount++;
          createReturnJSON();
        }
        if(!stdout.contains(searchString)){
          returned = 'false';
          searchStringCount++;
          createReturnJSON();
        }
        //console.log(stdout);
        //console.log(stderr);
      });
      
      var createReturnJSON = _.after(1, function() {
        if(returned == 'false'){
          //Set variables in JSON and return
          checksJSON.commands[indexOf].status = "false";
          if(indexOf == (checksJSON.commands.length-1)){
            sendResponse();
          }
          indexOf++;
        }
        else{
          //Set variables in JSON and return
          checksJSON.commands[indexOf].status = "true";
          if(indexOf == (checksJSON.commands.length-1)){
            sendResponse();
          }
          indexOf++;
        }
      })
    }

    var sendResponse = _.after(1, function() {
      for(i=0; i < checkCommands.length; i++){
        console.log(checksJSON.commands[i].status);
        if(checksJSON.commands[i].status == 'true'){
           countUp++
        }
      }
      if(countUp == checkCommands.length){
        res.status(200).send(JSON.stringify(checksJSON.commands, null, 2));
      }
      else{
        res.status(418).send(JSON.stringify(checksJSON.commands, null, 2));
      }
    })
  }
}

var allChecks = function(req, res) {
  var dburl = "http://127.0.0.1:"+PORT+"/health/db";
  console.log(dburl);
  var dbresponse;
  var fileresponse;
  var cmdresponse;
  var statusCodes = [];
  request({
      url: "http://127.0.0.1:"+PORT+"/health/db", 
      method: "GET",
  }, function(error, response, body) {
      if(response == undefined){
        // Exit function when request body is present. 
        console.log('Response body was blank.');
      }
      else {
        dbresponse=JSON.parse(response.body);
        statusCodes.push(JSON.parse(response.statusCode));
        console.log('Response body has data.');
        dbResponseReady();
      }
  });

  var dbResponseReady = _.after(1, function(){
      request({
        url: "http://127.0.0.1:"+PORT+"/health/files", 
        method: "GET",
      }, function(error, response, body) {
        if(response == undefined){
          // Exit function when request body is present. 
          console.log('Response body was blank.');
        }
        else {
          fileresponse=JSON.parse(response.body)
          statusCodes.push(JSON.parse(response.statusCode));
          console.log('Response body has data.');
          fileResponseReady();
        }
    });
  })

  var fileResponseReady = _.after(1, function() {
      request({
        url: "http://127.0.0.1:"+PORT+"/health/commands", 
        method: "GET",
      }, function(error, response, body) {
        if(response == undefined){
          // Exit function when request body is present. 
          console.log('Response body was blank.');
        }
        else {
          cmdresponse=JSON.parse(response.body)
          statusCodes.push(JSON.parse(response.statusCode));
          console.log('Response body has data.');
          allResponsesReady();
        }
    });
  })

  var allResponsesReady = _.after(1, function() {
    var allJson = {};
    allJson.databases = dbresponse;
    allJson.files = fileresponse;
    allJson.command = cmdresponse;
    var output = JSON.stringify(allJson);
    console.log(statusCodes);
    console.log(output);
    console.log(JSON.stringify(dbresponse));
    if(statusCodes.indexOf(418) > -1){
      res.status(418).render('test', { test: "CheckYoHealth!", data: allJson, statusCode: "418", lastUpdated: new Date() });
      //res.status(418).send(output);
    }
    else{
      res.render('test', { test: "CheckYoSelf!"});
      res.status(200).send(output);
    }
  })
}

var renderJSON = function(req, res){
  console.log(testYAMLjson);
}

var refreshYourself = function() {
    request({
      url: "http://127.0.0.1:9090/testyaml", 
      method: "GET",
  }, function(error, response, body) {
      console.log("Refreshing YAML page for console");
      console.log("Your current OS is: " + decideHostOS());
    });
}

// Views and helpers
server.set('views', __dirname + '/views');
server.set('view engine', 'jade');

//Testing the YAML - JSON for Jeff
//setInterval(testFiles, 7000)

// Routing
server.get('/', checkLocalHealth);
server.get('/testyaml', testYAMLjson);
server.get('/health', allChecks);
//server.get('/health?format=json', renderJSON);
server.get('/health/db', testDBconnection);
server.get('/health/files', testFiles);
server.get('/health/commands', testCommands);