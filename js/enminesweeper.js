$(document).ready(function () {
    $('body').on('click', 'button', takeAction);
    $('body').on('click touch', '.tile', tileClick);
    $('body').on('change', '#buttonContainer select[name=difficulty]', takeAction)
});
var game = Game(),
    timerRunning = false,
    timerInterval;

/**
 * Functions external of the actual game module that are specific to this implementation
 */
function takeAction () {
    var dataAction = $(this).attr('data-action');

    switch (dataAction) {
        case 'new':
            buildGame();
            break;
        case 'reveal':
            revealGame.call(this);
            break;
        case 'resume':
            resumeGame.call(this);
            break;
        case 'validate':
            validateGame.call(this);
            break;
        default:
            alert('Error! Unknown action ' + dataAction);
    }
}
function buildGame () {
    window.clearInterval(timerInterval);
    timerRunning = false;

    game.buildGame();
}
function revealGame () {
    $(this).attr('data-action', 'resume').text('Resume Game');
    game.revealGame();
}
function resumeGame () {
    $(this).attr('data-action', 'reveal').text('Reveal Mines');
    game.resumeGame();
}
function validateGame () {
    game.validateGame();
}
function tileClick (e) {
    if (true === window.gameOver) {
        return;
    }
    game.tileClick.call(this, e);
}
function gameOver (result) {
    window.gameOver = true;
    window.clearInterval(timerInterval);
    timerRunning = false;

    if ('lose' === result) {
        game.revealGame(function () {
            window.setTimeout(function () {
                alert("It's a sad sad day, you've lost.");
            }, 100);
        });
    } else if ('win' === result) {
        game.revealGame(function () {
            window.setTimeout(function () {
                alert('You win you smart devil you.');
            });
        });
    } else {
        alert('Errror in game over');
    }
}
function startTimer () {
    var timer = $('#timer'),
        count;

    timerInterval = window.setInterval(function () {
        count = parseInt(timer.text());
        count++;

        if (10 > count) {
            timer.text('00' + count);
        } else if (100 > count) {
            timer.text('0' + count);
        } else {
            timer.text(count);
        }
    }, 1000);
}

/*
 * Util Object
 *
 * A utility function with two methods for getting the full type of an object and
 * for type checking it against a passed string
 *
 * enType Function (object) return String
 * enIsType Function (object, string) return Boolean
 */
var Util = (function () {
  var enType = function (obj) {
    return Object.prototype.toString.call(obj);
  },
  enIsType = function (obj, type) {
    return -1 < enType(obj).toLowerCase().slice(8).indexOf(type.toLowerCase());
  };

  return {
    enType: enType,
    enIsType: enIsType
  };
})();

/*
 * Element Function
 *
 * Given a set of passed args will return an html element
 *
 * @param args Object (all properties not following will be ignored)
 *
 * @param type String must match an html element type eg. div, span etc.
 * @param id String the id attribute for the element
 * @param className String the class attribute for the element
 * @param style String the style attribute for the element
 * @param text String the "text" attribute as set by jQuery
 */
function Element (args) {
  args.type = Util.enIsType(args.type, 'string') ? args.type : 'div';

  var elem = document.createElement(args.type);
  elem.id = Util.enIsType(args.id, 'string') ? args.id : '';;
  elem.className = Util.enIsType(args.className, 'string') ? args.className : '';
  elem.setAttribute('style', Util.enIsType(args.style, 'string') ? args.style : '');

  if (Util.enIsType(args.text, 'string')) {
      elem.innerHTML = args.text;
  }

  return elem;
}

/**
 * Game Object takes no arguments
 *
 * Public methods
 *
 * buildGame
 * revealGame
 * validateGame
 * resumeGame
 * tileClick
 */
function Game () {
    /**
     * Private properties
     */
    var mines = {
        gridSize: 0,
        count: 0,
        map: [],
        isMine: function (coords) {
            return -1 < this.map.indexOf(coords);
        }
    },
    buildGame = function () {
        var gridSize = parseInt($('#buttonContainer select[name=difficulty]').val()),
            minesKey = {
                8: 10,
                12: 20,
                16: 30
            },
            tileWidth = 100 / gridSize,
            tile;

        mines.gridSize = gridSize;
        mines.count = minesKey[gridSize];
        mines.map = [];

        // Reset counters
        $('#remainingMines').text('0' + mines.count);
        $('#timer').text('000');

        // Remove tiles
        $('.innerTileContainer').html('');

        rowColIterator(gridSize, function (row, col) {
            tile = Element({
                type: 'div',
                id: row + '-' + col,
                className: 'tile',
                style: 'width:' + tileWidth + '%;'
            });

            $(tile).append(Element({
                type: 'div',
                className: 'innerTile',
                style: buildStyleStr('100%')
            }));

            $('.innerTileContainer').append(tile);
        });

        // Add a height to each tile
        $('.tile').each(function (i, t) {
            $(t).height($(t).width());
        });

        while (mines.map.length < mines.count) {
            // var $this = this;
            rowColIterator (gridSize, function (row, col) {
                if (0.1  >= Math.random()
                    && -1 === mines.map.indexOf(row + '-' + col)
                    && mines.map.length < mines.count) {

                    mines.map.push(row + '-' + col);
                }
            });
        }
        // console.log(mines);
    },
    revealGame = function (cb) {
        var gridSize = getGameSize();

        rowColIterator (gridSize, function (row, col) {
            var mineStats = analyzeTile($(makeTileId([row, col]))[0]);

            if (true === mineStats.isMine) {
                $(makeTileId([row, col])).addClass('revealMine');
            } else if (0 < mineStats.surroundingMines.length) {
                $(makeTileId([row, col])).addClass('surrounding-' + mineStats.surroundingMines.length + '-mines-reveal');
            }
        });
        if (Util.enIsType(cb, 'function')) {
            cb();
        }
    },
    validateGame = function () {
        // Assume game is valid
        var result = true,
            tileStats,
            tile;

        rowColIterator (getGameSize(), function (row, col) {
            tile = $('#' + row + '-' + col);
            tileStats = analyzeTile(document.getElementById(row + '-' + col));

            // If it's a mine and is not flagged
            // or it isn't a mine and is flagged FAIL!!!
            if ((true === tileStats.isMine && false === tile.hasClass('flagged'))
                || (false === tileStats.isMine && true === tile.hasClass('flagged'))){

                result = false;
            }
        });

        gameOver(true === result ? 'win' : 'lose');
    },
    resumeGame = function () {
        $('.tile').each(function (i, tile) {
            $(tile).removeClass('revealMine');
            for (var i = 0; i < 9; i++) {
                $(tile).removeClass('surrounding-' + i + '-mines-reveal');
            }
        });
    },
    tileClick = function (e) {
        if (false === timerRunning) {
            timerRunning = true;
            startTimer();
        }

        // On cmd/ctrl click flag the tile
        if (true === e.metaKey) {
            $(this).toggleClass('flagged');
            setRemainingMines();
            return;
        } else if ($(this).hasClass('flagged')) {
            alert("Watch out!\n"
                    + "You've flagged this tile as containing a mine.\n"
                    + "Please unflag it if you really want to click on it.");
            return;
        }

        var tileStats = analyzeTile(this);

        if (true === tileStats.isMine) {
            $(this).addClass('mine');
            gameOver('lose');
        } else if (0 < tileStats.surroundingMines.length) {
            $(this).addClass('empty surrounding-' + tileStats.surroundingMines.length + '-mines');
        } else {
            $(this).addClass('empty');
            checkSurroundingTiles(tileStats);
        };
    };

    /**
     * Private methods
     */

    // Subtracts the flagged mines from the total mines and sets that number in
    // the remaining mines counter
    function setRemainingMines () {
        var remainingMines = mines.map.length - $('.flagged').length,
            text = '';

        if (0 > remainingMines) {
            text = String(remainingMines);
        } else if (10 > remainingMines) {
            text = '00' + remainingMines;
        } else if (100 > remainingMines) {
            text = '0' + remainingMines;
        } else {
            alert("Error in setRemainingMines");
        }

        $('#remainingMines').text(text);
    }

    // Checks the tiles surrounding a tile specified by it's stats (see analyzeTile)
    // and assigns an appropriate class to that tile based on its surroundings
    // NOTE: This method will cascade out to other empty tiles
    function checkSurroundingTiles (tileStats) {
        var stats;

        tileStats.surroundingTiles.forEach(function (coordinates) {
            if (false === $('#' + coordinates).hasClass('empty')
                && false === $('#' + coordinates).hasClass('flagged')
                && -1 === $('#' + coordinates).attr('class').indexOf('surrounding')) {

                stats = analyzeTile(document.getElementById(coordinates));

                if (false === stats.isMine && 0 < stats.surroundingMines.length) {
                    // If the tile is not a mine and there are surrounding mines set a number
                    $('#' + coordinates).addClass('empty surrounding-' + stats.surroundingMines.length + '-mines');
                } else if (false === stats.isMine && 0 === stats.surroundingMines.length) {
                    // If the tile is not a mine and there are no surrounding mines set it empty
                    // and check surrounding tiles to continue cascade
                    $('#' + coordinates).addClass('empty');
                    checkSurroundingTiles(stats);
                } else {
                    // It's a mine!!!
                    $('#' + coordinates).addClass('mine');
                }
            }
        });
    }

    // Takes in an html element that is a div representing a tile
    // div must have an id attribute representing its coordinates in the game grid
    function analyzeTile (tile) {
        var stats = {
            coordinates: tile.id,
            isMine: false,
            surroundingTiles: [],
            surroundingMines: []
        },
        rowCol = stats.coordinates.split('-').map(function (n) {
            return parseInt(n);
        }),
        gameSize = getGameSize(),
        isMine;

        // Loop three times for the previous row current row and next row
        for (var r = -1; r < 2; r++) {
            for (var c = -1; c < 2; c++) {
                // Check that the row and column numbers are within the bounds of the game grid
                if (-1 < rowCol[0] + r
                    && -1 < rowCol[1] + c
                    && gameSize > rowCol[0] + r
                    && gameSize > rowCol[1] + c) {

                    var coords = makeCoords(rowCol, r, c);

                    stats.surroundingTiles.push(coords);
                    isMine = mines.isMine(coords);

                    if (true === isMine) {
                        if (coords === stats.coordinates) {
                            stats.isMine = true;
                        } else {
                            stats.surroundingMines.push(coords);
                        }
                    }
                }
            }
        }
        return stats;
    }

    // Takes in an array [row, col] and modifies each one to get a tile in relation
    // to the specified coordinates
    function makeCoords (rowCol, rowMod, colMod) {
        return [rowCol[0] + rowMod, rowCol[1] + colMod].join('-');
    }

    // Takes an array [row, col] and returns the jQuery selector for its coordinates
    // in the game grid ie, [2-6] = #2-6
    function makeTileId (rowCol) {
        return '#' + rowCol[0] + '-' + rowCol[1];
    }

    // Returns the grid size NOTE: Possibly deprecated in future versions
    function getGameSize () {
        return mines.gridSize;
    }

    // Think of .each or .forEach but with a specified number of iterations
    function rowColIterator (count, cb) {
        for (var r = 0; r < count; r++) {
            for (var c = 0; c < count; c++) {
                cb(r, c);
            }
        }
    }

    // Each tile needs to have its width and height dynamically set, this builds the string
    function buildStyleStr (dim) {
        return 'width:' + dim + '; height:' + dim + ';';
    }

    /**
     * Init Function
     *
     * Sets the content width
     */
    (function () {
        var winHeight = $(window).height(),
            winWidth = $(window).width(),
            dimension = (winHeight < winWidth ? winHeight : winWidth) * 0.6;

        $('#content').width(dimension);
    })();

    return {
        buildGame: buildGame,
        revealGame: revealGame,
        validateGame: validateGame,
        resumeGame: resumeGame,
        tileClick: tileClick
    };
};
