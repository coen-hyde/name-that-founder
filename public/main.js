var start = function(founders, startups) {
  var score = 0
    , total = 0;

  var pickFounder = function() {
    return founders[_.random(0, founders.length-1)];
  };

  var findStartup = function(startupId) {
    return _.find(startups, function(startup) {
      return startup.id === startupId;
    });
  };

  // Select a number of elements at random from an array
  var selectRandomList = function(list, number) {
    if (list.length === 0) {
      return [];
    }

    var selected = list[_.random(0, list.length-1)]
      , newList = [selected]
      , remaining = _.without(list, selected)
      , number = number - 1;

    if (number === 0 || remaining.length === 0) {
      return newList;
    }

    return _.union(newList, selectRandomList(remaining, number));
  }

  var findOthers = function(list, id) {
    return _.filter(list, function(item) {
      return item.id !== id;
    });
  };

  var selectStartupAnswers = function(founder) {
    var founderStartup = findStartup(founder.startup)
      , others = findOthers(startups, founder.startup);

    return _.shuffle(_.union([founderStartup], selectRandomList(others, 3)));
  };

  var selectFounderAnswers = function(founder) {
    var others = findOthers(founders, founder.id);

    return _.shuffle(_.union([founder], selectRandomList(others, 3)));
  };

  var makeFounderImage = function(founder) {
    return $("<img src='"+founder.image+"'>")
  };

  var makeAnswerDisplay = function(el, answer, correct, cb) {
    if (answer === correct) {
      score++
      var label = 'CORRECT!'
    }
    else {
      var instance = createjs.Sound.play("wakeup");
      var label = 'WRONG!'
    }

    var display = $('<div class="score-display"><p>'+label+'</p><p>'+score+' / '+total+' correct</p></div>');
    el.empty();
    el.append(display);
    display.fadeOut(1000, cb);
  };

  var showQuestion = function(question, dataList, correct, cb) {
    // New question is being displayed
    total++

    var wrapper = $('<div>')
      , list = $('<ul>');

    wrapper.append(list);

    _.each(dataList, function(item) {
      list.append($("<li><a href='#' data-id='"+item.id+"'>"+item.name+"</a></li>"));
    });

    list.find('a').click(function(evt) {
      evt.preventDefault();

      makeAnswerDisplay(wrapper, parseInt($(evt.target).attr('data-id')), correct, cb);
    });

    $('#question h2').text(question);
    $('#answerlist').append(wrapper);
  };

  var renderFounder = function(founder) {
    var startupAnswers = selectStartupAnswers(founder)
      , founderAnswers = selectFounderAnswers(founder);

    $('#founder').empty();
    $('#founder').append(makeFounderImage(founder));

    showQuestion('Which startup does this founder belong to?', startupAnswers, founder.startup, function() {
      showQuestion('What is their name?', founderAnswers, founder.id, nextFounder);
    });
  };

  var nextFounder = function() {
    renderFounder(pickFounder());
  }

  $(function() {
    // createjs.Sound.addEventListener("fileload", createjs.proxy(loadHandler, this));
    createjs.Sound.registerSound("/wakeup.mp3", "wakeup");

    nextFounder();
  });
};