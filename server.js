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
    'p_min': 0.0, // Minimum number of points a winner get (by winning vs. a n00b)
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

function indexOfPlayerByName(name, players) {
  for (var i = 0; i < players.length; i++) {
    if (name == players[i].name) return i
  }
  return -1
}

// Take (game, players) and produces updated (game, players)
function processGame(game, players) {

  var ixA = indexOfPlayerByName(game.players[0].name, players)
  var ixB = indexOfPlayerByName(game.players[1].name, players)

  var levelA = players[ixA].level
  var levelB = players[ixB].level

  var pointsA = players[ixA].points
  var pointsB = players[ixB].points

  var scoreA = game.players[0].score
  var scoreB = game.players[1].score

  var result_coef = scoreA > scoreB ? 1 : -1
  var winning_ratio = Math.abs(scoreA - scoreB) / Math.max(scoreA, scoreB)

  delta_level_winner = (levelA - levelB) * result_coef
  point_exchange = winner_compute_point_exchange(delta_level_winner, winning_ratio)
  console.log('New match: lvl ' + levelA + ' vs lvl ' + levelB + ': ' + scoreA + ' - ' + scoreB)
  console.log('Current player points: ' + pointsA + ' ' + pointsB)
  console.log('Winner wins: ' + point_exchange)

  gainA = result_coef * point_exchange
  if (result_coef == -1) { gainA = Math.round(gainA * (1 - PARAMS['loss_friction'])) } // Apply loss friction because A lost
  theoreticalScoreA = pointsA + gainA
  if (theoreticalScoreA < 0) {
    pointsA = 0
    gainA = gainA - theoreticalScoreA
  } else {
    pointsA = theoreticalScoreA
  }
  console.log('GainA: ' + gainA)

  gainB = result_coef * -1 * point_exchange
  if (result_coef == 1) { gainB = Math.round(gainB * (1 - PARAMS['loss_friction'])) } // Apply loss friction because B lost
  theoreticalScoreB = pointsB + gainB
  if (theoreticalScoreB < 0) {
    pointsB = 0
    gainB = gainB - theoreticalScoreB
  } else {
    pointsB = theoreticalScoreB
  }
  console.log('GainB: ' + gainB)

  // Update
  game.players[0].gain = gainA
  game.players[1].gain = gainB
  players[ixA].points = pointsA
  players[ixB].points = pointsB
  players[ixA].level = compute_level(pointsA)
  players[ixB].level = compute_level(pointsB)

  return { game: game, players: players }
}


var app = express()
app.use(express.static(__dirname + '/frontend/dist/'))

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser());

var port = 3000


var MONGODB = process.env['MONGODB_HOST']
var PRIVATE_MONGODB = process.env['PRIVATE_MONGODB_HOST']
var statsdClient = new statsd.StatsD()
statsdClient.post = 8125
statsdClient.host = process.env['STATSD_HOST']

app.use(express.static(path.join(__dirname, "frontend/dist")));

MongoClient.connect('mongodb://'+PRIVATE_MONGODB+'/private_snips_net', function(err, db) {
  if(err) throw err;
  app.get('/api/snips_users', function(req, res) {
    db.collection('user').find()
      .toArray(function(err, results) {
        res.status(200).send(results)
      })
  });
});

MongoClient.connect('mongodb://'+MONGODB+'/pp-engine', function(err, db) {

  if(err) throw err;
  playersCollection = db.collection('players');
  gamesCollection = db.collection('games');

  app.post('/api/games',function(req, res){

    if(Object.keys(req.body).length != 2){
      res.status(400).send('Body should be in the format { playerA: scoreA, playerB: scoreB}')
    } else {

      nameA = Object.keys(req.body)[0];
      nameB = Object.keys(req.body)[1];

      // Check if these players are in the database
      // and add them if required
      players = []
      async.each([ nameA, nameB ],

        // Iterator
        function (name, cb) {
          playersCollection.find({ "name": name }).toArray( function(err, results) {
            if(err) return cb(err)
            if (results.length == 0) {
              playersCollection.insert({ "name": name, "points": 0, "level": 0 }, function(err) {if (err) cb(err)})
              players.push({ "name": name, "points": 0, "level": 0 })
            } else {
              players.push(results[0])
            }
            cb()
          })
        },

        // Callback
        function(err){
          if(err) res.send(err)

          game = {
            uuid: uuid.v1(),
            date: new Date().toISOString(),
            players: [
              {
                name: nameA,
                score: req.body[nameA],
                // gain: gainA
              },
              {
                name: nameB,
                score: req.body[nameB],
                // gain: gainB
              }
            ]
          }

          result = processGame(game, players)
          game = result.game
          players = result.players
          
          // Push the new points in the db
          async.each([ nameA, nameB ],
            function(name,cb){
              ix = indexOfPlayerByName(name, players)
              playersCollection.findAndModify({ "name": name }
                ,[]
                ,{$set: {points: players[ix].points, level: players[ix].level }}
                ,{}
                , function(err, object) {
                  if(err) return cb(err)
                  if (process.env['ENV'] == 'PROD') {
                    statsdClient.gauge('pp-engine.' + name + '.points', players[ix].points);
                    statsdClient.gauge('pp-engine.' + name + '.level', players[ix].level);
                  }
                  cb()
                }
              )
            },
            function(err) {
              if(err) res.send(err)
              gamesCollection.insert(game, function(err, result) {
                if(err) res.send(err)
                res.status(200).send('Thanks for playing!')
              })
            }
          )
        }
      );
    }
  });

  app.get('/api/users', function(req, res) {
    playersCollection.find()
      .toArray(function(err, results) {
        res.status(200).send(results)
      })
  });

  app.get('/api/replay', function(req, res) {
    doCommit = req.query.commit !== undefined

    players = [];
    games = [];

    // Get all games
    gamesCollection.find({}, {'sort': 'date'}).toArray(function(err, results) {
      if(err) res.send(err)
      // Process
      results.forEach( function(game, gameIndex) {
        // Create player if needed
        game.players.forEach( function(player) {
          if (indexOfPlayerByName(player.name, players) == -1) { 
            players.push({ name: player.name, points: 0, level: 0 }) 
          }
        })

        result = processGame(game, players)
        players = result.players
        games.push(result.game)
      })
      if (!doCommit) {
        res.status(200).send({ 'players': players, 'games': games })
      } else {
        gamesCollection.drop(function(err, reply) {
          if (err) res.send(err)
          gamesCollection.insert(games, function(err, result) {});
        })
        playersCollection.drop(function(err, reply) {
          if (err) res.send(err)
          playersCollection.insert(players, function(err, result) {});
        })
        res.status(200).send("Done!")
      }
    })

  });

  // fetching user data
  app.get('/api/users/*',function(req, res){
    pars = req.url.slice(11);
    if(pars.indexOf('/')>-1){
      // call to '/api/users/:userid/games
      if(pars.slice(pars.indexOf('/')+1)=='games'){
        user = pars.slice(0,pars.indexOf('/'));
        gamesCollection.find(
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
      playersCollection.find({'name': user}).toArray(function(err, results) {
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






