var express = require('express')
  , elo = require('elo-rank')(15)
  , bodyParser = require('body-parser')
  , fs = require('fs')
  , uuid = require('node-uuid')
  , MongoClient = require('mongodb').MongoClient
  , async = require('async');


var app = express()

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser());

var port = 3000

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();        // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to our api!' });
});

var MONGODB = process.env['MONGODB']

MongoClient.connect('mongodb://'+MONGODB+'/pp-engine', function(err, db) {

  if(err) throw err;
  players = db.collection('players');
  games = db.collection('games');

  app.post('/api/games',function(req, res){

    if(Object.keys(req.body).length != 2){
      res.status(400).send('Body should be in the format { playerA: scoreA, playerB: scoreB}')
    } else {

      game_uuid = uuid.v1();

      nameA = Object.keys(req.body)[0].toLowerCase();
      nameB = Object.keys(req.body)[1].toLowerCase();

      // Check if these players are in the database
      scores = {}
      async.each([ nameA, nameB ],
        function(name,cb){
          players.find({ "name": name }).toArray(function(err, results) {
            if(results.length==0){
              players.insert({ "name": name, "score": 1200}, function(err){
                if(err) return cb(err)
                scores[name] = 1200
                cb()
              })
            } else{
              scores[name] = results[0]['score']
              cb()
            }
          })
        },function(err){
          if(err) res.send(err)

          // Update scores
          var expectedScoreA = elo.getExpected(scores[nameA],scores[nameB]);
          var expectedScoreB = elo.getExpected(scores[nameB],scores[nameA]);
          result = req.body[nameA]>req.body[nameB] ? 1:0;
          oldscores = scores;
          scores[nameA] = elo.updateRating(expectedScoreA,result,scores[nameA]);
          scores[nameB] = elo.updateRating(expectedScoreB,1-result,scores[nameB]);

          // Push the new scores to the db
          async.each([ nameA, nameB ],
            function(name,cb){
              players.findAndModify({ "name": name }
                ,[]
                ,{$set: {score: scores[name] }}
                ,{}
                , function(err, object) {
                  if(err) return cb(err)
                  cb()
                }
              )
            },
            function(err){
              if(err) res.send(err)
              games.insert({
                uuid: game_uuid,
                date: new Date().toISOString(),
                players: [
                  {
                    name: nameA,
                    score: scores[nameA],
                    gain: scores[nameA] - oldscores[nameA]
                  },
                  {
                    name: nameB,
                    score: scores[nameB],
                    gain: scores[nameB] - oldscores[nameB]
                  }
                ]
              }, function(err){
                if(err) res.send(err)
                players.find().toArray(function(err, results) {
                  res.status(200).send('Thanks for playing!')
                })
              })
            }
          )
        }
      );
    }
  });

  // fetching user data
  app.get('/api/users/*',function(req, res){
    pars = req.url.slice(11);
    if(pars.indexOf('/')>-1){
      // call to '/api/users/:userid/games
      if(pars.slice(pars.indexOf('/')+1)=='games'){
        user = pars.slice(0,pars.indexOf('/'));
        games.find(
          {
            players: {
              $elemMatch: {
                name: user
              }
            }
          }
        ).toArray(function(err, results) {
          res.status(200).send(results)
        })
      } else {
        res.status(400).send('invalid query')
      }
    } else {
      // call to '/api/users/:userid
      user = pars;
      players.find({'name': user}).toArray(function(err, results) {
        if(results.length==0){
          res.status(400).send('user not found')
        } else {
          res.status(200).send(results[0])
        }
      })
    }
  });

  app.get('/',function(req,res){
    res.sendfile(__dirname + '/frontend/app/index.html');
  })

  app.get('/rank',function(req,res){
    res.sendfile(__dirname + '/frontend/app/pages/rank.html');
  })

  app.get('/user',function(req,res){
    res.sendfile(__dirname + '/frontend/app/pages/user.html');
  })

  // app.get('/', express.static(__dirname + '/frontend/index.html'));


  // START THE SERVER
  // =============================================================================
  app.listen(port);
  console.log('Magic happens on port ' + port);

})






