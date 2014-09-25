var express = require('express')
  , elo = require('elo-rank')(15)
  , bodyParser = require('body-parser')
  , fs = require('fs')
  , uuid = require('node-uuid')
  , MongoClient = require('mongodb').MongoClient
  , path = require('path')
  , async = require('async');


PARAMS = {
    'p_min': 1.0, // Minimum number of points exchangeable (if two players at same level compete)
    'p_slope': 1.0, // Extra points exchanged per level difference
    'p_wining_ratio_coef': 0.05, // Extra points given for each percentage point of ball win above 50%
    'level_delta': 2.0, // Number of points required to reach level 2
    'level_delta_increment': 1.0, // Increment of number of points to next level, added per level
    'p_points_for_nomatch': 10 // TODO: THIS is random, was missing
}



function compute_point_exchange(delta_levels, winning_ratio){
    dp = Math.round(
            PARAMS['p_min'] + PARAMS['p_slope'] * Math.abs(delta_levels) + PARAMS['p_points_for_nomatch'] * winning_ratio
        )
    return dp;
}

function compute_level(points){
    c1 = PARAMS['level_delta']
    c2 = PARAMS['level_delta_increment']
    a = 0.5*c2
    b = -0.5*c2 + c1
    c = -points
    det = b*b - 4.0 * a * c
    r = [0.5 * (-b + Math.sqrt(det))/a, 0.5 * (-b - Math.sqrt(det))/a]
    return Math.floor(Math.max.apply(Math, r))
}

function compute_points_to_next_level(level){
    return PARAMS['level_delta'] * level + (level - 1.0) * level * 0.5 * PARAMS['level_delta_increment']
}


var app = express()
app.use(express.static(__dirname + '/frontend/dist/'))

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser());

var port = 3000


var MONGODB = process.env['MONGODB_HOST']

app.use(express.static(path.join(__dirname, "frontend/dist")));

MongoClient.connect('mongodb://'+MONGODB+'/pp-engine', function(err, db) {

  if(err) throw err;
  players = db.collection('players');
  games = db.collection('games');

  app.post('/api/games',function(req, res){

    if(Object.keys(req.body).length != 2){
      res.status(400).send('Body should be in the format { playerA: scoreA, playerB: scoreB}')
    } else {

      game_uuid = uuid.v1();

      nameA = Object.keys(req.body)[0];
      nameB = Object.keys(req.body)[1];

      // Check if these players are in the database
      points = {}
      async.each([ nameA, nameB ],
        function(name,cb){
          players.find({ "name": name }).toArray(function(err, results) {
            if(results.length==0){
              players.insert({ "name": name, "points": 0}, function(err){
                if(err) return cb(err)
                points[name] = 0
                cb()
              })
            } else{
              points[name] = results[0]['points']
              cb()
            }
          })
        },function(err){

          if(err) res.send(err)

          var levelA = compute_level(points[nameA])
          var levelB = compute_level(points[nameB])
          var winning_ratio = Math.abs(req.body[nameA]-req.body[nameB]) / Math.max(req.body[nameA],req.body[nameB])
          point_exchange = compute_point_exchange(levelA-levelB, winning_ratio)
          console.log(
            nameA + 
            '(' + levelA + ') ' + 
            req.body[nameA] + 
            ' - ' + 
            req.body[nameB] + 
            ' ' + nameB + 
            '(' + levelB + ') ' + 
            ' -- Exchanged ' + 
            point_exchange + 
            ' points')
          var result_coef = req.body[nameA]>req.body[nameB] ? 1:-1

          theoreticalScoreA = points[nameA] + result_coef * point_exchange
          if (theoreticalScoreA < 0) {
            points[nameA] = 0
            gainA = result_coef * point_exchange - theoreticalScoreA
          } else {
            points[nameA] = theoreticalScoreA
            gainA = result_coef * point_exchange
          }

          theoreticalScoreB = points[nameB] - result_coef * point_exchange
          if (theoreticalScoreB < 0) {
            points[nameB] = 0
            gainB = -result_coef * point_exchange - theoreticalScoreB
          } else {
            points[nameB] = theoreticalScoreB
            gainB = -result_coef * point_exchange
          }

          // Push the new points to the db
          async.each([ nameA, nameB ],
            function(name,cb){
              players.findAndModify({ "name": name }
                ,[]
                ,{$set: {points: points[name], level: compute_level(points[name]) }}
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
                    score: req.body[nameA],
                    gain: gainA
                  },
                  {
                    name: nameB,
                    score: req.body[nameB],
                    gain: gainB
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

  app.get('/api/users', function(req, res) {
    players.find()
    .toArray(function(err, results) {
      res.status(200).send(results)
    })
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

  // START THE SERVER
  // =============================================================================
  app.listen(port);
  console.log('Magic happens on port ' + port);

})






