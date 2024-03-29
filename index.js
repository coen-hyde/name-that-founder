var qs = require('querystring');

var express = require('express')
  , stylus = require('stylus')
  , request = require('request')
  , async = require('async')
  , _ = require('lodash');

var startupSlugs = [
  'goods-platform',
  'carreira-beauty',
  'platejoy',
  'anyadir-education',
  'btcjam',
  'popbasic',
  'sales-beach',
  'shopeando',
  'builk',
  'wishplz',
  'cityblis-2',
  'bounty-hunter',
  'partender',
  'equityzen',
  'ubiome',
  'maillift',
  'silverpush',
  'realtyshares',
  'adespresso',
  'sidelines',
  'buzzstarter',
  'viralgains',
  '3sourcing',
  'populr-me',
  'olset',
  'zboard',
  'weplann',
  'launchtrack',
  'grata',
  'shopseen'
]

var getStartupInfo = function(slug, cb) {
  async.waterfall([
    function(next) {
      request('https://api.angel.co/1/search/slugs?query='+slug, function(err, res, body) {
        if (err) {
          return next(err);
        }

        if (res.statusCode !== 200) {
          return next("Could not find startup: "+slug);
        }

        next(null, JSON.parse(body));
      });
    },
    function(search, next) {
      request('https://api.angel.co/1/startups/'+search.id, function(err, res, body) {
        var data = JSON.parse(body);
        data.slug = slug;

        return cb(null, data);
      });
    }
  ], cb);
}

var getFounders = function(startupId, cb) {
  request('https://api.angel.co/1/startups/'+startupId+'/roles', function(err, res, body) {
    var data = JSON.parse(body)
      , founders = _.filter(data.startup_roles, function(role) {
        return (role.role === 'founder')
      });

    return cb(null, founders);
  });
};

var getAllFounders = function(cb) {
  async.waterfall([
    function(next) {
      async.mapLimit(startupSlugs, 10, getStartupInfo, next);
    },
    function(startups, next) {
      async.mapLimit(_.pluck(startups, 'id'), 10, getFounders, next);
    }
  ], function(err, results) {
    if (err) {
      return cb(err);
    }

    compressed = _.map(_.flatten(results), function(founder) {
      var data = _.pick(founder.tagged, ['id', 'name', 'angellist_url', 'image']);
      data.startup = _.pick(founder.startup, ['id', 'name', 'angellist_url', 'logo_url', 'thumb_urls', 'company_url']);
      return data
    });

    return cb(null, compressed);
  });
}

var app = express()
  , founders = []
  , startups = [];

app.set('view engine', 'jade');

app.use(stylus.middleware({
    src: __dirname + '/style'
  , dest: __dirname + '/public'
}));

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res, next) {
  res.render('index', {
    founders: JSON.stringify(founders),
    startups: JSON.stringify(startups)
  });
});


var updateFounderList = function(cb){
  getAllFounders(function(err, founderList) {
    if (err) {
      return;
    }

    founders = _.map(founderList, function(founder) {
      var data = _.omit(founder, 'startup');
      data.startup = founder.startup.id;
      return data;
    });

    var massStartupList = _.pluck(founderList, 'startup');

    startups = _.map(_.uniq(_.pluck(founders, 'startup')), function(startupId) {
      return _.find(massStartupList, function(startup) {
        return startup.id === startupId;
      });
    });

    if (typeof cb !== 'undefined') {
      cb();
    }
  });
}

app.listen(process.env.PORT, function() {
  console.log('Listening on port: '+process.env.PORT);
});

setTimeout(updateFounderList, 5*60000);

updateFounderList();
