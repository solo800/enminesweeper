$(document).ready(function () {
    $('body').on('click', 'button', takeAction);
    $('body').on('click', '.tile', tileClick);
});
var game = Game(),
    timerRunning = false,
    timerInterval;

function takeAction () {
    console.log('taking action', $(this).attr('data-action'));
    var dataAction = $(this).attr('data-action');

    switch (dataAction) {
        case 'new':
            buildGame();
            break;
        case 'reveal':
            revealGame.call(this);
            break;
        default:
            alert('Error! Unknown action ' + dataAction);
    }
}
function buildGame () {
    // Reset counters
    $('#remainingMines').text('010');
    $('#timer').text('000');

    // Remove current tiles
    $('.innerTileContainer').html('');

    window.clearInterval(timerInterval);
    timerRunnint = false;

    game.buildGame();
}
function revealGame () {
    game.revealGame();
}
function tileClick () {
    if (false === timerRunning) {
        timerRunning = true;
        startTimer();
    }

    var tileType = getTyleType(this);

    switch (tileType) {
        case 'empty':
        case 'number':
            $(this).addClass('empty');
            break;
        case 'mine':
            $(this).addClass('empty mine');
            youLose();
            break;
        default:
            alert('There was an error getting tile type!');
    }
}
function getTyleType (tile) {
    var coords = tile.id;

    if (-1 < game.mines.indexOf(coords)) {
        return 'mine';
    }

    // Not a mine check if it's surrounding tiles are in the mine map


    return 'empty';
}
function getTileMineCount (coords) {
    var rowCol = coords.split('-'),
        row = rowCol[0],
        col = rowCol[1];

    
}
function triggerAdjacentTiles () {

}
function youLose () {
    alert('You are a loser! :(');
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
    var mines = {},
    buildGame = function () {
        var gridSize = 8,
            tileWidth = 100 / gridSize,
            mines = {
                count: 10,
                map: []
            },
            tile;

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
            rowColIterator (gridSize, function (row, col) {
                if (0.1  >= Math.random()
                    && -1 === mines.map.indexOf(row + '-' + col)
                    && mines.map.length < mines.count) {

                    mines.map.push(row + '-' + col);
                }
            });
        }
        this.mines = mines;
        // console.log(mines);
    },

    revealGame = function () {
        var gridSize = 0;

        $('.innerTileContainer .tile').each(function (i, el) {
            if ('0' === el.id.slice(0, 1)) {
                gridSize++;
            } else {
                return false;
            }
        });
        // console.log('gridSize', gridSize);
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
        buildGame: buildGame,
        revealGame: revealGame
    };
};
