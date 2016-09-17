$(document).ready(function () {
    $('body').on('click', 'button', takeAction);
    $('body').on('click', '.tile', tileClick);
    $('body').on('change', '#buttonContainer select[name=difficulty]', takeAction)
});
var game = Game(),
    timerRunning = false,
    timerInterval;

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
    }
}
function setRemainingMines () {
    var remainingMines = game.mines.map.length - $('.flagged').length,
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
function checkSurroundingTiles (tileStats) {
    var stats;

    tileStats.surroundingTiles.forEach(function (coordinates) {
        if (false === $('#' + coordinates).hasClass('empty')
            && false === $('#' + coordinates).hasClass('flagged')
            && -1 === $('#' + coordinates).attr('class').indexOf('surrounding')) {

            stats = analyzeTile(document.getElementById(coordinates));

            if (false === stats.isMine && 0 < stats.surroundingMines.length) {
                $('#' + coordinates).addClass('empty surrounding-' + stats.surroundingMines.length + '-mines');
            } else if (false === stats.isMine && 0 === stats.surroundingMines.length) {
                $('#' + coordinates).addClass('empty');
                checkSurroundingTiles(stats);
            } else {
                // Should be a mine
                $('#' + coordinates).addClass('mine');
            }
        }
    });
}
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
    gameSize = game.getGameSize.call(game),
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
                isMine = game.mines.isMine(coords);

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

    // console.log(stats.coordinates, stats, game.mines.map);
    return stats;
}
function makeCoords (rowCol, rowMod, colMod) {
    return [rowCol[0] + rowMod, rowCol[1] + colMod].join('-');
}
function makeTileId (rowCol) {
    return '#' + rowCol[0] + '-' + rowCol[1];
}
function gameOver (result) {
    if ('lose' === result) {
        game.revealGame(function () {
            window.setTimeout(function () {
                alert("It's a sad sad day, you've lost.");

                // Reset the game board with basic game
                $('button[data-action=new]').trigger('click');
            }, 100);
        });
    } else if ('win' === result) {
        game.revealGame(function () {
            window.setTimeout(function () {
                alert('You win you smart devil you.');

                // Reset the game board with basic game
                $('button[data-action=new]').trigger('click');
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

function Game () {
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

        this.mines.gridSize = gridSize;
        this.mines.count = minesKey[gridSize];
        this.mines.map = [];

        // Reset counters
        $('#remainingMines').text('0' + this.mines.count);
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

        while (this.mines.map.length < this.mines.count) {
            var $this = this;
            rowColIterator (gridSize, function (row, col) {
                if (0.1  >= Math.random()
                    && -1 === $this.mines.map.indexOf(row + '-' + col)
                    && $this.mines.map.length < $this.mines.count) {

                    $this.mines.map.push(row + '-' + col);
                }
            });
        }
        // console.log(mines);
    },

    revealGame = function (cb) {
        var gridSize = getGameSize.call(game);

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

        rowColIterator (getGameSize.call(game), function (row, col) {
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

    getGameSize = function () {
        return this.mines.gridSize;
    },

    resumeGame = function () {
        $('.tile').each(function (i, tile) {
            $(tile).removeClass('revealMine');
            for (var i = 0; i < 9; i++) {
                $(tile).removeClass('surrounding-' + i + '-mines-reveal');
            }
        });
    };

    function rowColIterator (count, cb) {
        for (var r = 0; r < count; r++) {
            for (var c = 0; c < count; c++) {
                cb(r, c);
            }
        }
    }

    function buildStyleStr (dim) {
        return 'width:' + dim + '; height:' + dim + ';';
    }

    (function () {
        var winHeight = $(window).height(),
            winWidth = $(window).width(),
            dimension = (winHeight < winWidth ? winHeight : winWidth) * 0.6;

        // $('#content').height(dimension);
        $('#content').width(dimension);
    })();

    return {
        mines: mines,
        buildGame: buildGame,
        revealGame: revealGame,
        resumeGame: resumeGame,
        validateGame: validateGame,
        getGameSize: getGameSize
    };
};
