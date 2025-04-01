// ALL CREDIT HERE GOES TO MyAnimeList.com. This is just an archive of the file.
// ORIGINAL SOURCE: https://cdn.myanimelist.net/js/april2025.js?v=1743468351


/**
 * chatUI constructor
 * @constructor
 * @param {d3-selection} container - Container for the chat interface.
 * @return {object} chatUI object
 */
var chatUI = (function (container) {

  var module = {};

  module.container = container.append('div').attr('id', 'cb-container');
  module.config = null;
  module.bubbles = [];
  module.ID = 0;
  module.keys = {};
  module.types = {};
  module.inputState = false;
  module.height = 0;
  module.scroll = module.container.append('div').attr('id', 'cb-flow');
  module.flow = module.scroll.append('div').attr('class', 'cb-inner');
  module.input = module.container.append('div').attr('id', 'cb-input').style('display', 'none');
  module.input.append('div').attr('id', 'cb-input-container').append('input').attr('type', 'text');
  module.input.append('button').text('+');


  /**
   * updateContainer should be called when height or width changes of the container changes
   * @memberof chatUI
   */
  module.updateContainer = function () {
    module.height = module.container.node().offsetHeight;
    module.flow.style('padding-top', module.height + 'px');
    module.scroll.style('height', (module.height - ((module.inputState == true) ? 77 : 0)) + 'px');
    module.scrollTo('end');
  };

  /**
   * @memberof chatUI
   * @param {object} options - object containing configs {type:string (e.g. 'text' or 'select'), class:string ('human' || 'bot'), value:depends on type}
   * @param {function} callback - function to be called after everything is done
   * @return {integer} id - id of the bubble
   */
  module.addBubble = function (options, callback) {
    callback = callback || function () { };

    if (!(options.type in module.types)) {
      throw 'Unknown bubble type';
    } else {

      module.ID++;
      var id = module.ID;
      module.bubbles.push({
        id: id,
        type: options.type
        //additional info
      });
      module.keys[id] = module.bubbles.length - 1;

      //segment container
      var outer = module.flow.append('div')
        .attr('class', 'cb-segment cb-' + options.class + ' cb-bubble-type-' + options.type)
        .attr('id', 'cb-segment-' + id);

      //speaker icon
      outer.append('div').attr('class', 'cb-icon');

      var bubble = outer.append('div')
        .attr('class', 'cb-bubble ' + options.class)
        // .style("height", "50px")
        .append('div')
        .attr('class', 'cb-inner');


      outer.append('hr');

      module.types[options.type](bubble, options, callback);

      module.scrollTo('end');

      return module.ID;
    }
  };

  /**
   * @memberof chatUI
   * @param {d3-selection} bubble - d3 selection of the bubble container
   * @param {object} options - object containing configs {type:'text', class:string ('human' || 'bot'), value:array of objects (e.g. [{label:'yes'}])}
   * @param {function} callback - function to be called after everything is done
   */
  module.types.select = function (bubble, options, callback) {
    bubble.selectAll('.cb-choice').data(options.value).enter().append('div')
      .attr('class', 'cb-choice')
      .text(function (d) { return d.label; })
      .on('click', function (d) {
        d3.select(this).classed('cb-active', true);
        d3.select(this.parentNode).selectAll('.cb-choice').on('click', function () { });
        callback(d);
      });
  };

  /**
   * @memberof chatUI
   * @param {d3-selection} bubble - d3 selection of the bubble container
   * @param {object} options - object containing configs {type:'text', class:string ('human' || 'bot'), value:string (e.g. 'Hello World')}
   * @param {function} callback - function to be called after everything is done
   */
  module.types.text = function (bubble, options, callback) {
    if (('delay' in options) && options.delay) {
      var animatedCircles = '<div class="circle"></div><div class="circle"></div><div class="circle"></div>';
      bubble.append('div')
        .attr('class', 'cb-waiting')
        .html(animatedCircles);

      setTimeout(function () {

        bubble.select(".cb-waiting").remove();
        module.appendText(bubble, options, callback);

      }, (isNaN(options.delay) ? 1000 : options.delay));
    } else {
      module.appendText(bubble, options, callback);
    }

  };

  /**
   * Helper Function for adding text to a bubble
   * @memberof chatUI
   * @param {d3-selection} bubble - d3 selection of the bubble container
   * @param {object} options - object containing configs {type:'text', class:string ('human' || 'bot'), value:string (e.g. 'Hello World')}
   * @param {function} callback - function to be called after everything is done
   */
  module.appendText = function (bubble, options, callback) {
    bubble.attr('class', 'bubble-ctn-' + options.class).append('p')
      .html(options.value)
      .transition()
      .duration(200)
      .style("width", "auto")
      .style('opacity', 1);

    chat.scrollTo('end');

    callback();
  };

  /**
   * Showing the input module and set cursor into input field
   * @memberof chatUI
   * @param {function} submitCallback - function to be called when user presses enter or submits through the submit-button
   * @param {function} typeCallback - function to when user enters text (on change)
   */
  module.showInput = function (submitCallback, typeCallback) {
    module.inputState = true;

    if (typeCallback) {
      module.input.select('input')
        .on('change', function () {
          typeCallback(d3.select(this).node().value);
        });
    } else {
      module.input.select('input').on('change', function () { });
    }

    module.input.select('input').on('keyup', function () {
      if (d3.event.keyCode == 13) {
        submitCallback(module.input.select('input').node().value);
        module.input.select('input').node().value = '';
      }
    });

    module.input.select('button')
      .on('click', function () {
        submitCallback(module.input.select('input').node().value);
        module.input.select('input').node().value = '';
      });

    module.input.style('display', 'block');
    module.updateContainer();

    module.input.select('input').node().focus();
    module.scrollTo('end');
  };

  /**
   * Hide the input module
   */
  module.hideInput = function () {
    module.input.select('input').node().blur();
    module.input.style('display', 'none');
    module.inputState = false;
    module.updateContainer();
    module.scrollTo('end');
  };

  /**
   * Remove a bubble from the chat
   * @memberof chatUI
   * @param {integer} id - id of bubble provided by addBubble
   */
  module.removeBubble = function (id) {
    module.flow.select('#cb-segment-' + id).remove();
    module.bubbles.splice(module.keys[id], 1);
    delete module.keys[id];
  };

  /**
   * Remove all bubbles until the bubble with 'id' from the chat
   * @memberof chatUI
   * @param {integer} id - id of bubble provided by addBubble
   */
  module.removeBubbles = function (id) {
    for (var i = module.bubbles.length - 1; i >= module.keys[id]; i--) {
      module.removeBubble(module.bubbles[i].id);
    }
  };

  /**
   * Remove all bubbles until the bubble with 'id' from the chat
   * @memberof chatUI
   * @param {integer} id - id of bubble provided by addBubble
   * @return {object} obj - {el:d3-selection, obj:bubble-data}
   */
  module.getBubble = function (id) {
    return {
      el: module.flow.select('#cb-segment-' + id),
      obj: module.bubbles[module.keys[id]]
    };
  };

  /**
   * Scroll chat flow
   * @memberof chatUI
   * @param {string} position - where to scroll either 'start' or 'end'
   */
  module.scrollTo = function (position) {
    //start
    var s = 0;
    //end
    if (position == 'end') {
      s = module.scroll.property('scrollHeight') - (module.height - 77);
    }
    d3.select('#cb-flow').transition()
      .duration(300)
      .tween("scroll", scrollTween(s));

  };

  function scrollTween(offset) {
    return function () {
      var i = d3.interpolateNumber(module.scroll.property('scrollTop'), offset);
      return function (t) { module.scroll.property('scrollTop', i(t)); };
    };
  }

  function debouncer(func, _timeout) {
    var timeoutID, timeout = _timeout || 200;
    return function () {
      var scope = this, args = arguments;
      clearTimeout(timeoutID);
      timeoutID = setTimeout(function () {
        func.apply(scope, Array.prototype.slice.call(args));
      }, timeout);
    };
  }

  //On Resize scroll to end
  d3.select(window).on('resize', debouncer(function (e) {
    module.updateContainer();
  }, 200));

  module.updateContainer();

  return module;
});


var chat = chatUI(d3.select('#april_fools_2025 .frame'));
var first = true;

var escapeHTML = function (unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

var conversation = {},
  userName = '{{ user.name }}';

// Conversation flow code with question numbers removed from displayed text

// Initialize conversation: Greeting and Q1
conversation.init = function () {
  // Greet: "Hello!", "My name is Mai.", "I'm excited to help you find the perfect anime recommendation!"
  chat.addBubble({ type: 'text', value: 'Hello!', class: 'bot', delay: 1500 }, function () {
    chat.addBubble({ type: 'text', value: 'My name is Mai.', class: 'bot', delay: 1000 }, function () {
      chat.addBubble({ type: 'text', value: "I'm excited to help you find the perfect anime recommendation!", class: 'bot', delay: 1000 }, function () {
        conversation.q1();
      });
    });
  });
};

// Q1: "Do you prefer classic or modern anime?"
conversation.q1 = function () {
  chat.addBubble({ type: 'text', value: 'Do you prefer classic or modern anime?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({ type: 'select', value: [{ label: 'Classic' }, { label: 'Modern' }], class: 'human', delay: 0 }, conversation.q1Response);
  });
};

conversation.q1Response = function (response) {
  if (!response || !response.label) return;
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  if (response.label === 'Classic') {
    chat.addBubble({ type: 'text', value: 'Got it, you want an anime that can stand the test of time!', class: 'bot', delay: 1000 }, function () {
      conversation.q2();
    });
  } else if (response.label === 'Modern') {
    chat.addBubble({ type: 'text', value: 'Got it, you want an anime that was aired recently!', class: 'bot', delay: 1000 }, function () {
      conversation.q2();
    });
  }
};

// Q2: "Which genre are you in the mood for?" (Options: Romance, Supernatural, Horror, Space, Sports, Music)
conversation.q2 = function () {
  chat.addBubble({ type: 'text', value: 'Which genre are you in the mood for?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Romance' },
        { label: 'Supernatural' },
        { label: 'Horror' },
        { label: 'Space' },
        { label: 'Sports' },
        { label: 'Music' }
      ], class: 'human', delay: 0
    }, conversation.q2Response);
  });
};

conversation.q2Response = function (response) {
  if (!response || !response.label) return;
  switch (response.label) {
    case 'Music': conversation.q3_Music(); break;
    case 'Horror': conversation.q3_Horror(); break;
    case 'Space': conversation.q3_Space(); break;
    case 'Romance': conversation.q3_Romance(); break;
    case 'Supernatural': conversation.q3_Supernatural(); break;
    case 'Sports': conversation.q3_Sports(); break;
  }
};

/* ===== MUSIC BRANCH ===== */
// Q3_Music: "Which type of music do you prefer?"
conversation.q3_Music = function () {
  chat.addBubble({ type: 'text', value: 'Which type of music do you prefer?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Rock' },
        { label: 'Pop' },
        { label: 'EDM' },
        { label: 'Classical' }
      ], class: 'human', delay: 0
    }, conversation.q3_MusicResponse);
  });
};

conversation.q3_MusicResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Rock': reply = 'So you like hype music. Okay!'; break;
    case 'Pop': reply = "Pop is Mai's favorite, too!"; break;
    case 'EDM': reply = 'That hurts my puppy ears, but if you say so!'; break;
    case 'Classical': reply = "You're so cultured!"; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.q4_Music();
  });
};

// Q4_Music: "Which anime's OP/ED song do you want to play at your funeral?" (User Input)
conversation.q4_Music = function () {
  chat.addBubble({ type: 'text', value: "Which anime's OP/ED song do you want to play at your funeral?", class: 'bot', delay: 1000 }, function () {
    chat.showInput(conversation.q4_MusicResponse);
  });
};

conversation.q4_MusicResponse = function (response) {
  if (response.trim() === '') return;
  chat.addBubble({ type: 'text', value: response, class: 'human', delay: 0 });
  chat.hideInput();
  chat.addBubble({ type: 'text', value: "Mai hasn't heard of that song before, but nice choice!", class: 'bot', delay: 1000 }, function () {
    chat.addBubble({ type: 'text', value: 'Now for the most important question...', class: 'bot', delay: 1000 }, function () {
      conversation.q5_Music();
    });
  });
};

// Q5_Music: "What is your favorite dessert?" (Select)
conversation.q5_Music = function () {
  chat.addBubble({ type: 'text', value: 'What is your favorite dessert?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Ice Cream' },
        { label: 'Dango' },
        { label: 'Cream Puffs' },
        { label: 'Crepe Cake' },
        { label: 'Manjuu' }
      ], class: 'human', delay: 0
    }, conversation.q5_MusicResponse);
  });
};

conversation.q5_MusicResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Ice Cream': reply = 'ðŸŽµ <i>Mai screams! You scream! Everyone on MAL screams for ice cream!</i> ðŸŽµ'; break;
    case 'Dango': reply = 'ðŸŽµ <i>Dango~ Dango~ Daikazoku~</i> ðŸŽµ'; break;
    case 'Cream Puffs': reply = 'ðŸŽµ <i>Shuu Cream Funky Love~~</i> ðŸŽµ'; break;
    case 'Crepe Cake': reply = "<img src='https://media1.tenor.com/m/dsumnt80P7kAAAAd/cake-cupcake.gif'/>"; break;
    case 'Manjuu': reply = 'ðŸŽµ <i>One, with tax included, is 360 yen~ Joyo manju! We\'re having a special sale today~</i> ðŸŽµ'; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.r_Music();
  });
};

conversation.r_Music = function () {
  chat.addBubble({ type: 'text', value: 'Let me think for a momentâ€¦', class: 'bot', delay: 4000 }, function () {
    chat.addBubble({ type: 'text', value: 'Based on your answers, I have the perfect anime for you!', class: 'bot', delay: 1500 }, function () {
      chat.addBubble({ type: 'text', value: "Your anime recommendation is: <i>One Piece</i><br><a href=\"https://myanimelist.net/anime/21/One_Piece\"><img src='https://cdn.myanimelist.net/images/anime/1244/138851l.jpg'/></a>", class: 'bot', delay: 1500 }, function () {
        chat.addBubble({ type: 'text', value: 'After you have watched all 1,122 episodes, then you can watch <i>One Piece Film: Red</i>!', class: 'bot', delay: 1500 }, function () {
          chat.addBubble({ type: 'text', value: 'It contains 7 songs written by famous composers, all performed by Ado! ðŸŽµ', class: 'bot', delay: 1500 }, function () {
            chat.addBubble({ type: 'text', value: 'Mai is happy to have found the perfect music anime for you ðŸ˜Š', class: 'bot', delay: 1500 }, function () {
              chat.addBubble({ type: 'text', value: 'Bye bye for now!', class: 'bot', delay: 1500 });
              localStorage.setItem('af2025_state', 'true');
              window._et$.addEvent('impression', { 'data-ga-impression-type': '2025_april_fools_chat|result_music' })
            });
          });
        });
      });
    });
  });
};

/* ===== HORROR BRANCH ===== */
// Q3_Horror: "The zombie apocalypse is coming ðŸ§ŸðŸ§ŸðŸ§Ÿ Who do you want on your team?" (Select)
conversation.q3_Horror = function () {
  chat.addBubble({ type: 'text', value: 'The zombie apocalypse is coming ðŸ§ŸðŸ§ŸðŸ§Ÿ Who do you want on your team?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Gojou' },
        { label: 'Makima' },
        { label: 'Maomao' },
        { label: 'Gintoki' }
      ], class: 'human', delay: 0
    }, conversation.q3_HorrorResponse);
  });
};

conversation.q3_HorrorResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Gojou': reply = "â›â›<i>Are you the strongest because you're Satoru Gojou, or are you Satoru Gojou because you're the strongest?</i>âœâœ"; break;
    case 'Makima': reply = "Let's hope she doesn't sacrifice you to save humanity ðŸ¤ž"; break;
    case 'Maomao': reply = 'Do you think she has a cure for zombification?'; break;
    case 'Gintoki': reply = "Well, at least you'll laugh to death before getting eaten..."; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.q4_Horror();
  });
};

// Q4_Horror: "Name the last scary anime you watched:" (User Input)
conversation.q4_Horror = function () {
  chat.addBubble({ type: 'text', value: 'Name the last scary anime you watched:', class: 'bot', delay: 1000 }, function () {
    chat.showInput(conversation.q4_HorrorResponse);
  });
};

conversation.q4_HorrorResponse = function (response) {
  if (response.trim() === '') return;
  chat.addBubble({ type: 'text', value: response, class: 'human', delay: 0 });
  chat.hideInput();
  chat.addBubble({ type: 'text', value: "That's too scary for Mai!", class: 'bot', delay: 1000 }, function () {
    chat.addBubble({ type: 'text', value: 'Now for the most important question...', class: 'bot', delay: 1000 }, function () {
      conversation.q5_Horror();
    });
  });
};

// Q5_Horror: "Which manga series would you buy all the volumes of?" (Select)
conversation.q5_Horror = function () {
  chat.addBubble({ type: 'text', value: 'Which manga series would you buy all the volumes of?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Golgo 13' },
        { label: 'Baki' },
        { label: 'Cooking Papa' },
        { label: 'Meitantei Conan' }
      ], class: 'human', delay: 0
    }, conversation.q5_HorrorResponse);
  });
};

conversation.q5_HorrorResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Golgo 13': reply = 'Wow, you picked the longest manga ever at <b>215</b> volumes!'; break;
    case 'Baki': reply = "Mai hopes <b>153</b> volumes won't plummet your wallet..."; break;
    case 'Cooking Papa': reply = 'How has he been cooking for <b>172</b> volumes?'; break;
    case 'Meitantei Conan': reply = "So many mysteries, it's at <b>106</b> volumes and counting!"; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.r_Horror();
  });
};

conversation.r_Horror = function () {
  chat.addBubble({ type: 'text', value: 'Let me think for a momentâ€¦', class: 'bot', delay: 4000 }, function () {
    chat.addBubble({ type: 'text', value: 'Based on your answers, I have the perfect anime for you!', class: 'bot', delay: 1500 }, function () {
      chat.addBubble({ type: 'text', value: "Your anime recommendation is: <i>One Piece</i><br><a href=\"https://myanimelist.net/anime/21/One_Piece\"><img src='https://cdn.myanimelist.net/images/anime/1244/138851l.jpg'/></a>", class: 'bot', delay: 1500 }, function () {
        chat.addBubble({ type: 'text', value: "There is nothing more horrifying than needing to watch 1,122 episodes to catch up!", class: 'bot', delay: 1500 }, function () {
          chat.addBubble({ type: 'text', value: "With one episode a day, you'll be done by Oct 3, 2028!", class: 'bot', delay: 1500 }, function () {
            chat.addBubble({ type: 'text', value: 'Mai is happy to have found the perfect horror anime for you ðŸ˜Š', class: 'bot', delay: 1500 }, function () {
              chat.addBubble({ type: 'text', value: 'Bye bye for now!', class: 'bot', delay: 1500 });
              localStorage.setItem('af2025_state', 'true');
              window._et$.addEvent('impression', { 'data-ga-impression-type': '2025_april_fools_chat|result_horror' })
            });
          });
        });
      });
    });
  });
};

/* ===== SPACE BRANCH ===== */
// Q3_Space: "Which Gundam series did you enjoy the most?" (Select)
conversation.q3_Space = function () {
  chat.addBubble({ type: 'text', value: 'Which Gundam series did you enjoy the most?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Wing' },
        { label: 'Seed' },
        { label: 'Bebop' },
        { label: 'Iron-Blooded Orphans' }
      ], class: 'human', delay: 0
    }, conversation.q3_SpaceResponse);
  });
};

conversation.q3_SpaceResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Wing': reply = "Showing your age, are we?"; break;
    case 'Seed': reply = "â›â›<i>No matter how many times they get wiped away, we will never stop replanting the flowers.</i>âœâœ -Jesus Yamato"; break;
    case 'Bebop': reply = '<img src="https://media1.tenor.com/m/sDOwuUenzIIAAAAC/cowboy-bibop.gif"/>'; break;
    case 'Iron-Blooded Orphans': reply = '<i>Raise your flag</i> ðŸ³ï¸ðŸ˜­'; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.q4_Space();
  });
};

// Q4_Space: "If you could tell Shinji one thing, what would it be?" (User Input)
conversation.q4_Space = function () {
  chat.addBubble({ type: 'text', value: 'If you could tell Shinji one thing, what would it be?', class: 'bot', delay: 1000 }, function () {
    chat.showInput(conversation.q4_SpaceResponse);
  });
};

conversation.q4_SpaceResponse = function (response) {
  if (response.trim() === '') return;
  chat.addBubble({ type: 'text', value: response, class: 'human', delay: 0 });
  chat.hideInput();
  chat.addBubble({ type: 'text', value: '"Get in the damn robot" is the only correct answer!', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({ type: 'text', value: 'Now for the most important question...', class: 'bot', delay: 1000 }, function () {
      conversation.q5_Space();
    });
  });
};

// Q5_Space: "Pick an anime marathon snack:" (Select)
conversation.q5_Space = function () {
  chat.addBubble({ type: 'text', value: 'Pick an anime marathon snack:', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Pocky' },
        { label: 'Umaibo' },
        { label: 'Honey Butter Chips' },
        { label: 'Konpeito' }
      ], class: 'human', delay: 0
    }, conversation.q5_SpaceResponse);
  });
};

conversation.q5_SpaceResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Pocky': reply = 'Mai prefers Strawberry!'; break;
    case 'Umaibo': reply = 'Yummy ðŸ˜‹'; break;
    case 'Honey Butter Chips': reply = '<i>munch, munch</i>'; break;
    case 'Konpeito': reply = 'Is that really a snack?'; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.r_Space();
  });
};

conversation.r_Space = function () {
  chat.addBubble({ type: 'text', value: 'Let me think for a momentâ€¦', class: 'bot', delay: 4000 }, function () {
    chat.addBubble({ type: 'text', value: 'Based on your answers, I have the perfect anime for you!', class: 'bot', delay: 1500 }, function () {
      chat.addBubble({ type: 'text', value: "Your anime recommendation is: <i>One Piece</i><br><a href=\"https://myanimelist.net/anime/21/One_Piece\"><img src='https://cdn.myanimelist.net/images/anime/1244/138851l.jpg'/></a>", class: 'bot', delay: 1500 }, function () {
        chat.addBubble({ type: 'text', value: 'By the time the series ends, humanity could be living on Mars!', class: 'bot', delay: 1500 }, function () {
          chat.addBubble({ type: 'text', value: "Isn't that space-tacular?", class: 'bot', delay: 1500 }, function () {
            chat.addBubble({ type: 'text', value: 'Mai is happy to have found the perfect space anime for you ðŸ˜Š', class: 'bot', delay: 1500 }, function () {
              chat.addBubble({ type: 'text', value: 'Bye bye for now!', class: 'bot', delay: 1500 });
              localStorage.setItem('af2025_state', 'true');
              window._et$.addEvent('impression', { 'data-ga-impression-type': '2025_april_fools_chat|result_space' })
            });
          });
        });
      });
    });
  });
};

/* ===== ROMANCE BRANCH ===== */
// Q3_Romance: "Which anime made you cry the most?" (Select)
conversation.q3_Romance = function () {
  chat.addBubble({ type: 'text', value: 'Which anime made you cry the most?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Shigatsu wa Kimi no Uso / Your Lie in April' },
        { label: 'Murai no Koi' },
        { label: 'Angel Beats' },
        { label: 'Kaguya-sama' }
      ], class: 'human', delay: 0
    }, conversation.q3_RomanceResponse);
  });
};

conversation.q3_RomanceResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Shigatsu wa Kimi no Uso / Your Lie in April': reply = 'ðŸŽ»ðŸ˜­ðŸŽ»ðŸ˜­ðŸŽ»ðŸ˜­'; break;
    case 'Murai no Koi': reply = 'Wondering what this is? Watch it to find out âœ¨'; break;
    case 'Angel Beats': reply = '<i>My Soul, Your Beats</i>'; break;
    case 'Kaguya-sama': reply = '<img src="https://media1.tenor.com/m/5eLr04PIMJgAAAAd/kaguya-kaguya-sama.gif">'; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.q4_Romance();
  });
};

// Q4_Romance: "What type of flowers would you buy for your waifu/husbando?" (User Input)
conversation.q4_Romance = function () {
  chat.addBubble({ type: 'text', value: 'What type of flowers would you buy for your waifu/husbando?', class: 'bot', delay: 1000 }, function () {
    chat.showInput(conversation.q4_RomanceResponse);
  });
};

conversation.q4_RomanceResponse = function (response) {
  if (response.trim() === '') return;
  chat.addBubble({ type: 'text', value: response, class: 'human', delay: 0 });
  chat.hideInput();
  chat.addBubble({ type: 'text', value: "That's so sweet. Mai has some roses for you! ðŸŒ¹ðŸŒ¹ðŸŒ¹", class: 'bot', delay: 1000 }, function () {
    chat.addBubble({ type: 'text', value: 'Now for the most important question...', class: 'bot', delay: 1000 }, function () {
      conversation.q5_Romance();
    });
  });
};

// Q5_Romance: "Which of these words is not Japanese?" (Select)
conversation.q5_Romance = function () {
  chat.addBubble({ type: 'text', value: 'Which of these words is not Japanese?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Kuriinji' },
        { label: 'Rabu' },
        { label: 'Meruhen' },
        { label: 'Kokoro' }
      ], class: 'human', delay: 0
    }, conversation.q5_RomanceResponse);
  });
};

conversation.q5_RomanceResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Kuriinji': reply = 'Hehe ðŸ¤­'; break;
    case 'Rabu': reply = "Incorrect! Mai doesn't rabu you anymore."; break;
    case 'Meruhen': reply = "Incorrect! Mai loves fairytales."; break;
    case 'Kokoro': reply = "Incorrect! You hurt Mai's kokoro."; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.r_Romance();
  });
};

conversation.r_Romance = function () {
  chat.addBubble({ type: 'text', value: 'Let me think for a momentâ€¦', class: 'bot', delay: 4000 }, function () {
    chat.addBubble({ type: 'text', value: 'Based on your answers, I have the perfect anime for you!', class: 'bot', delay: 1500 }, function () {
      chat.addBubble({ type: 'text', value: "Your anime recommendation is: <i>One Piece</i><br><a href=\"https://myanimelist.net/anime/21/One_Piece\"><img src='https://cdn.myanimelist.net/images/anime/1244/138851l.jpg'/></a>", class: 'bot', delay: 1500 }, function () {
        chat.addBubble({ type: 'text', value: 'The best thing about romance isâ€”shipping!', class: 'bot', delay: 1500 }, function () {
          chat.addBubble({ type: 'text', value: "And when you think of ships, who doesn't think of this series?", class: 'bot', delay: 1500 }, function () {
            chat.addBubble({ type: 'text', value: 'Mai is happy to have found the perfect romance anime for you ðŸ˜Š', class: 'bot', delay: 1500 }, function () {
              chat.addBubble({ type: 'text', value: 'Bye bye for now!', class: 'bot', delay: 1500 });
              localStorage.setItem('af2025_state', 'true');
              window._et$.addEvent('impression', { 'data-ga-impression-type': '2025_april_fools_chat|result_romance' })
            });
          });
        });
      });
    });
  });
};

/* ===== SUPERNATURAL BRANCH ===== */
// Q3_Supernatural: "Which youkai would you want to meet most?" (Select)
conversation.q3_Supernatural = function () {
  chat.addBubble({ type: 'text', value: 'Which youkai would you want to meet most?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Kappa' },
        { label: 'Nyanko-sensei' },
        { label: 'Yuki-onna' },
        { label: 'Turbo Granny' }
      ], class: 'human', delay: 0
    }, conversation.q3_SupernaturalResponse);
  });
};

conversation.q3_SupernaturalResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Kappa': reply = "Just carry some cucumbers and you'll be daijoubu!"; break;
    case 'Nyanko-sensei': reply = "Just carry some sake and you'll be daijoubu!"; break;
    case 'Yuki-onna': reply = 'Better bundle up then! â„ï¸â„ï¸â„ï¸'; break;
    case 'Turbo Granny': reply = '<img src="https://media1.tenor.com/m/1IpMQScfnIQAAAAd/anime-dandadan.gif"/>'; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.q4_Supernatural();
  });
};

// Q4_Supernatural: "If you had a time machine, what year would you travel to?" (User Input)
conversation.q4_Supernatural = function () {
  chat.addBubble({ type: 'text', value: 'If you had a time machine, what year would you travel to?', class: 'bot', delay: 1000 }, function () {
    chat.showInput(conversation.q4_SupernaturalResponse);
  });
};

conversation.q4_SupernaturalResponse = function (response) {
  if (response.trim() === '') return;
  chat.addBubble({ type: 'text', value: response, class: 'human', delay: 0 });
  chat.hideInput();
  chat.addBubble({ type: 'text', value: 'But... would you be able to talk to Mai then? ðŸ¥º', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({ type: 'text', value: 'Now for the most important question...', class: 'bot', delay: 1000 }, function () {
      conversation.q5_Supernatural();
    });
  });
};

// Q5_Supernatural: "Drink of choice?" (Select)
conversation.q5_Supernatural = function () {
  chat.addBubble({ type: 'text', value: 'Drink of choice?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Coffee' },
        { label: 'Tea' },
        { label: 'Ramune' },
        { label: 'The tears of my enemies' }
      ], class: 'human', delay: 0
    }, conversation.q5_SupernaturalResponse);
  });
};

conversation.q5_SupernaturalResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Coffee': reply = 'Caffeine fiend, are we?'; break;
    case 'Tea': reply = 'With milk and boba?'; break;
    case 'Ramune': reply = 'Can Mai have the marble?'; break;
    case 'The tears of my enemies': reply = 'ðŸ˜¨'; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.r_Supernatural();
  });
};

conversation.r_Supernatural = function () {
  chat.addBubble({ type: 'text', value: 'Let me think for a momentâ€¦', class: 'bot', delay: 4000 }, function () {
    chat.addBubble({ type: 'text', value: 'Based on your answers, I have the perfect anime for you!', class: 'bot', delay: 1500 }, function () {
      chat.addBubble({ type: 'text', value: "Your anime recommendation is: <i>One Piece</i><br><a href=\"https://myanimelist.net/anime/21/One_Piece\"><img src='https://cdn.myanimelist.net/images/anime/1244/138851l.jpg'/></a>", class: 'bot', delay: 1500 }, function () {
        chat.addBubble({ type: 'text', value: 'By the time you finish 1,122 episodes, you may be a ghost yourself!', class: 'bot', delay: 1500 }, function () {
          chat.addBubble({ type: 'text', value: "That's beyond Mai's understanding, must be supernatural!", class: 'bot', delay: 1500 }, function () {
            chat.addBubble({ type: 'text', value: 'Mai is happy to have found the perfect supernatural anime for you ðŸ˜Š', class: 'bot', delay: 1500 }, function () {
              chat.addBubble({ type: 'text', value: 'Bye bye for now!', class: 'bot', delay: 1500 });
              localStorage.setItem('af2025_state', 'true');
              window._et$.addEvent('impression', { 'data-ga-impression-type': '2025_april_fools_chat|result_supernatural' })
            });
          });
        });
      });
    });
  });
};

/* ===== SPORTS BRANCH ===== */
// Q3_Sports: "What sport do you want to see most in an original anime?" (Select)
conversation.q3_Sports = function () {
  chat.addBubble({ type: 'text', value: 'What sport do you want to see most in an original anime?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Kayaking' },
        { label: 'Ice Dance' },
        { label: 'Cricket' },
        { label: 'Curling' }
      ], class: 'human', delay: 0
    }, conversation.q3_SportsResponse);
  });
};

conversation.q3_SportsResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Kayaking': reply = "Learn to kayak because zombies can't swim /nods"; break;
    case 'Ice Dance': reply = 'Mai strongly recommends you watch <a href="https://youtu.be/vNmYRNr1CVo" target="_blank">this video</a>!<br><img src="https://64.media.tumblr.com/21b68c7da6c57ac6db0606e5c1a9c9f8/07dc44faa028e8a0-ce/s540x810/5572c53237a12d597fb1ca975736d72b5dd09906.gif">'; break;
    case 'Cricket': reply = "How British of you!"; break;
    case 'Curling': reply = "The only sport you can play with beer in one hand ðŸ»"; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.q4_Sports();
  });
};

// Q4_Sports: "What was the last anime you thought was PEAK?" (User Input)
conversation.q4_Sports = function () {
  chat.addBubble({ type: 'text', value: 'What was the last anime you thought was PEAK?', class: 'bot', delay: 1000 }, function () {
    chat.showInput(conversation.q4_SportsResponse);
  });
};

conversation.q4_SportsResponse = function (response) {
  if (response.trim() === '') return;
  chat.addBubble({ type: 'text', value: response, class: 'human', delay: 0 });
  chat.hideInput();
  chat.addBubble({ type: 'text', value: "Mai hasn't heard of that anime, are you sure it's good?", class: 'bot', delay: 1000 }, function () {
    chat.addBubble({ type: 'text', value: 'Now for the most important question...', class: 'bot', delay: 1000 }, function () {
      conversation.q5_Sports();
    });
  });
};

// Q5_Sports: "Name an imaginary college class you would want to attend?" (Select)
conversation.q5_Sports = function () {
  chat.addBubble({ type: 'text', value: 'Name an imaginary college class you would want to attend?', class: 'bot', delay: 1000 }, function () {
    chat.addBubble({
      type: 'select', value: [
        { label: 'Battle Shounen 101' },
        { label: 'Native Isekai 205' },
        { label: 'Anisongs 307' },
        { label: 'Seiyuu 402' }
      ], class: 'human', delay: 0
    }, conversation.q5_SportsResponse);
  });
};

conversation.q5_SportsResponse = function (response) {
  if (!response || !response.label) return;
  var reply = '';
  switch (response.label) {
    case 'Battle Shounen 101': reply = "It's time for your training arc."; break;
    case 'Native Isekai 205': reply = "Aren't those just fantasy?"; break;
    case 'Anisongs 307': reply = 'Karaoke for credit ðŸŽ¤'; break;
    case 'Seiyuu 402': reply = 'This is how you become a master at Seiyuu School ðŸ˜'; break;
  }
  chat.addBubble({ type: 'text', value: response.label, class: 'human', delay: 0 });
  chat.addBubble({ type: 'text', value: reply, class: 'bot', delay: 1000 }, function () {
    conversation.r_Sports();
  });
};

conversation.r_Sports = function () {
  chat.addBubble({ type: 'text', value: 'Let me think for a momentâ€¦', class: 'bot', delay: 4000 }, function () {
    chat.addBubble({ type: 'text', value: 'Based on your answers, I have the perfect anime for you!', class: 'bot', delay: 1500 }, function () {
      chat.addBubble({ type: 'text', value: "Your anime recommendation is: <i>One Piece</i><br><a href=\"https://myanimelist.net/anime/21/One_Piece\"><img src='https://cdn.myanimelist.net/images/anime/1244/138851l.jpg'/></a>", class: 'bot', delay: 1500 }, function () {
        chat.addBubble({ type: 'text', value: 'Watching 1,122 episodes will definitely feel like a marathon!', class: 'bot', delay: 1500 }, function () {
          chat.addBubble({ type: 'text', value: "Don't forget to stretch every now and then, okay?", class: 'bot', delay: 1500 }, function () {
            chat.addBubble({ type: 'text', value: 'Mai is happy to have found the perfect sports anime for you ðŸ˜Š', class: 'bot', delay: 1500 }, function () {
              chat.addBubble({ type: 'text', value: 'Bye bye for now!', class: 'bot', delay: 1500 });
              localStorage.setItem('af2025_state', 'true');
              window._et$.addEvent('impression', { 'data-ga-impression-type': '2025_april_fools_chat|result_sports' })
            });
          });
        });
      });
    });
  });
};



//New bubble type
chat.types.line = function (bubble, options, callback) {
};

$(function () {
  var $element = $('#april_fools_2025_button');
  if (localStorage.getItem('af2025_state') !== 'true') {
    $element.addClass('bounce');
  }

  $element.on('click', function () {
    // Optionally, reset the transform to its original state
    var $button = $(this);
    var buttonOffset = $button.offset();
    var buttonWidth = $button.outerWidth();
    var buttonHeight = $button.outerHeight();
    var buttonCenterX = buttonOffset.left + buttonWidth / 2;
    var buttonCenterY = buttonOffset.top + buttonHeight / 2;

    var $target = $('#april_fools_2025');
    // æœ€çµ‚ä½ç½®ã¯ãã®ã¾ã¾ã«ã€è¦ç´ ã‚’è¡¨ç¤º
    $target.css('display', 'block');

    // è¦ç´ ã®ä½ç½®ã¨ã‚µã‚¤ã‚ºã‚’å–å¾—
    var targetOffset = $target.offset();
    var targetWidth = $target.outerWidth();
    var targetHeight = $target.outerHeight();

    // ã‚¯ãƒªãƒƒã‚¯ã—ãŸãƒœã‚¿ãƒ³ã®ä¸­å¿ƒãŒã€#april_fools_2025 å†…ã®ã©ã®ä½ç½®ã«ç›¸å½“ã™ã‚‹ã‹è¨ˆç®—
    var originX = buttonCenterX - targetOffset.left;
    var originY = buttonCenterY - targetOffset.top;

    // transform-origin ã‚’è¨­å®šã—ã€åˆæœŸçŠ¶æ…‹ã¯ scale(0) ã«ã—ã¦éžè¡¨ç¤ºã«è¦‹ã›ã‚‹
    $target.css({
      'transform-origin': originX + 'px ' + originY + 'px',
      'transform': 'scale(0)',
      'transition': 'transform 0s'
    });

    // å¼·åˆ¶å†æç”»ã—ã¦åˆæœŸçŠ¶æ…‹ã‚’ç¢ºå®š
    $target[0].offsetWidth;

    // 0.5ç§’ã‹ã‘ã¦ scale(1) ã«æ‹¡å¤§ã•ã›ã‚‹
    $target.css({
      'transition': 'transform 0.5s ease-out',
      'transform': 'scale(1)'
    });

    setTimeout(function () {
      window.dispatchEvent(new Event('resize'))
      conversation.init();
    }, 600);

  });

  $('#april_fools_2025 .cover').on('click', function (e) {
    var $button = $('#april_fools_2025_button');
    var buttonOffset = $button.offset();
    var buttonCenterX = buttonOffset.left + $button.outerWidth() / 2;
    var buttonCenterY = buttonOffset.top + $button.outerHeight() / 2;

    var $target = $('#april_fools_2025');
    var targetOffset = $target.offset();
    var originX = buttonCenterX - targetOffset.left;
    var originY = buttonCenterY - targetOffset.top;

    // Set the transform-origin to the button's center relative to #april_fools_2025
    $target.css({
      'transform-origin': originX + 'px ' + originY + 'px',
      'transition': 'transform 0.5s ease-in',
      'transform': 'scale(0)'
    });
    chat.addBubble({ type: 'line' });

    // After the animation completes, hide the element
    setTimeout(function () {
      // ã‚¢ãƒ‹ãƒ¡ãƒ¼ã‚·ãƒ§ãƒ³çµ‚äº†å¾Œã€displayã¨transformãƒ—ãƒ­ãƒ‘ãƒ†ã‚£ã‚’ãƒªã‚»ãƒƒãƒˆ
      $target.css({
        'display': 'none',
        'transform': ''
      });
    }, 500);
  });
});
