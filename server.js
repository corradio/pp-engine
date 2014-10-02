var express = require('express')
  , elo = require('elo-rank')(15)
  , bodyParser = require('body-parser')
  , fs = require('fs')
  , uuid = require('node-uuid')
  , MongoClient = require('mongodb').MongoClient
  , path = require('path')
  , async = require('async')
  , statsd = require('node-statsd');


PARAMS = {
    'p_0': 10.0, // Point given if two players of same level compete
    'p_slope': 3.0, // Extra points added/removed per level difference
    'p_min': 5.0, // Minimum number of points a winner get (by winning vs. a n00b)
    'max_nomatch_multiplier': 0.2, // Max multiplier added. Defined at max ball diff (obtained when winning x to 0 - aka nomatch)
    'level_delta': 20.0, // Number of points required to reach level 1
    'level_delta_increment': 10.0, // Increment of number of points to next level, added per level
    'loss_friction': 0.4 // Reduction coefficient applied to losses, in order to be nice. Can be seen as experience gain
}


function winner_compute_point_exchange(delta_level_winner, winning_ratio) {
    ball_multiplier = 1 + (winning_ratio * PARAMS['max_nomatch_multiplier'])

    // Lower bound on points that can be won (but no upper bound)
    points_level_difference = Math.max( PARAMS['p_min'], PARAMS['p_0'] - PARAMS['p_slope'] * delta_level_winner )

    dp = Math.round(points_level_difference * ball_multiplier)
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
var statsdClient = new statsd.StatsD()
statsdClient.post = 8125
statsdClient.host = process.env['STATSD_HOST']

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
          var result_coef = req.body[nameA] > req.body[nameB] ? 1 : -1
          var winning_ratio = Math.abs(req.body[nameA]-req.body[nameB]) / Math.max(req.body[nameA], req.body[nameB])

          delta_level_winner = (levelA - levelB) * result_coef
          point_exchange = winner_compute_point_exchange(delta_level_winner, winning_ratio)
          console.log('New match: lvl ' + levelA + ' vs lvl ' + levelB + ': ' + req.body[nameA] + ' - ' + req.body[nameB])
          console.log('Current player points: ' + points[nameA] + ' ' + points[nameB])
          console.log('Winner wins: ' + point_exchange)

          gainA = result_coef * point_exchange
          if (result_coef == -1) { gainA = Math.round(gainA * (1 - PARAMS['loss_friction'])) } // Apply loss friction because A lost
          theoreticalScoreA = points[nameA] + gainA
          if (theoreticalScoreA < 0) {
            points[nameA] = 0
            gainA = gainA - theoreticalScoreA
          } else {
            points[nameA] = theoreticalScoreA
          }
          console.log('GainA: ' + gainA)

          gainB = result_coef * -1 * point_exchange
          if (result_coef == 1) { gainB = Math.round(gainB * (1 - PARAMS['loss_friction'])) } // Apply loss friction because B lost
          theoreticalScoreB = points[nameB] + gainB
          if (theoreticalScoreB < 0) {
            points[nameB] = 0
            gainB = gainB - theoreticalScoreB
          } else {
            points[nameB] = theoreticalScoreB
          }
          console.log('GainB: ' + gainB)

          // Push the new points to the db
          async.each([ nameA, nameB ],
            function(name,cb){
              players.findAndModify({ "name": name }
                ,[]
                ,{$set: {points: points[name], level: compute_level(points[name]) }}
                ,{}
                , function(err, object) {
                  if(err) return cb(err)
                  if (process.env['ENV'] == 'PROD') {
                    statsdClient.gauge('pp-engine.' + name + '.points', points[name]);
                    statsdClient.gauge('pp-engine.' + name + '.level', compute_level(points[name]));
                  }
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






