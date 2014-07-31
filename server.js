var express = require('express')
  , elo = require('elo-rank')(15)
  , bodyParser = require('body-parser')
  , fs = require('fs');


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

router.route('/games')

  .post(function(req, res) {

    console.log(req.body)
    rankings = require(process.cwd()+'/rankings.json')
    nameA = Object.keys(req.body)[0];
    nameB = Object.keys(req.body)[1];
    rankA = rankings[nameA]
    rankB = rankings[nameB]
    console.log(rankA,rankB)
    var expectedScoreA = elo.getExpected(rankA,rankB);
    var expectedScoreB = elo.getExpected(rankB,rankA);

    result = req.body[nameA]>req.body[nameB] ? 1:0;
    rankings[nameA] = elo.updateRating(expectedScoreA,result,rankA);
    rankings[nameB] = elo.updateRating(expectedScoreB,1-result,rankB);

    fs.writeFile(process.cwd()+'/rankings.json',JSON.stringify(rankings),function(err){
      if (err){
        res.send(err)
      }
      res.json({ message: 'Thanks for playing!' });
    })

  });



app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);


// var playerA = 1200;
// var playerB = 1400;


// //Gets expected score for first parameter
// var expectedScoreA = elo.getExpected(playerA,playerB);
// var expectedScoreB = elo.getExpected(playerB,playerA);

// //update score, 1 if won 0 if lost
// playerA = elo.updateRating(expectedScoreA,1,playerA);
// playerB = elo.updateRating(expectedScoreB,0,playerB);


// app.get('*', function (req, res) {
//   console.log(req.url)
//   rankings = require(process.cwd()+'/rankings.json')
//   playerA = rankings['Jo']
//   playerB = rankings['Tristan']
//   var expectedScoreA = elo.getExpected(playerA,playerB);
//   var expectedScoreB = elo.getExpected(playerB,playerA);
//   res.send('Hello World2')
// })

// app.listen(3000)