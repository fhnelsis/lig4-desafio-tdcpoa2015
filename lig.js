
'use strict';

var directions = {
    right: "left",
    left: "right",
    bottom: "top",
    top: "bottom",
    bottomLeft: "topRight",
    bottomRight: "topLeft",
    topLeft: "bottomRight",
    topRight: "topLeft"
};

/*
 * A função Algorithm encapsula a lógica das jogadas.
 * A instância do Algorithm persiste durante toda a partida.
 */
 
function calculate(tgt, p1, p2) {
    var name = p1 + p2.charAt(0).toUpperCase() + p2.slice(1);
    Object.defineProperty(tgt, name, {
        get: function() {
            if (tgt[p1] === null) {
                return null;
            }
            return tgt[p1][p2];
        }
    });
}

function Piece(value) {
    this.value = value || null;
    this.left = null;
    this.right = null;
    this.top = null;
    this.bottom = null;
    calculate(this, "top", "left");
    calculate(this, "top", "right");
    calculate(this, "bottom", "left");
    calculate(this, "bottom", "right");
}

Piece.prototype.link = function(otherPiece, dir) {
    switch (dir) {
        case "bottom":
            this.bottom = otherPiece;
            otherPiece.top = this;
            break;
        case "left":
            this.left = otherPiece;
            otherPiece.right = this;
            break;
    }
};

Piece.prototype.getStreak = function(dir) {
    var value = null;
    var piece = this;
    var streak = [];

    while (piece[dir] != null && piece[dir].value != null) {
        if (value == null) value = piece[dir].value;
        if (value != piece[dir].value) break;
        piece = piece[dir];
        streak.push(piece);
    }

    dir = directions[dir];
    piece = this;

    while (piece[dir] != null && piece[dir].value != null) {
        if (value == null) value = piece[dir].value;
        if (value != piece[dir].value) break;
        piece = piece[dir];
        streak.push(piece);
    }

    return {
        items: streak,
        value: value,
        size: streak.length,
        piece: this
    };

}; 
 
function Algorithm() {
    this.pieceMap = null;
}

Algorithm.prototype.initializeMap = function(gameBoard) {
    var allNull = true;
    var pieceMap = [];
    var line;
    var piece;
    var cols = gameBoard.length;
    var rows = gameBoard[0].length;

    for (var col = 0; col < cols; col += 1) {
        line = [];
        pieceMap.push(line);
        for (var row = 0; row < rows; row += 1) {
            piece = new Piece(gameBoard[col][row]);
            if (piece.value != null) allNull = false;
            piece.x = row;
            piece.y = col;
            if (col > 0) {
                piece.link(pieceMap[col - 1][row], "left");
            }
            if (row > 0) {
                piece.link(pieceMap[col][row - 1], "bottom");
            }

            line.push(piece)
        }
    }

    this.pieceMap = pieceMap;
    this.gameBoard = gameBoard;
    return allNull;
};

Algorithm.prototype.updateMap = function(gameBoard) {
    var cols = gameBoard.length;
    var rows = gameBoard[0].length;
    var pieceMap = this.pieceMap;
    for (var col = 0; col < cols; col += 1) {
        for (var row = 0; row < rows; row += 1) {
            pieceMap[col][row].value = gameBoard[col][row];
        }
    }
    this.gameBoard = gameBoard;
};

Algorithm.prototype.getEmptyOfCol = function(colNum) {
    var col = this.pieceMap[colNum];
    var piece = col[0];

    while (piece && piece.value != null) {

        piece = piece.top;
    }
    
    return piece;
};

Algorithm.prototype.analyzeMove = function(movePiece) {

    var positions = ["right", "left", "topRight", "topLeft", "bottom", "bottomLeft", "bottomRight"];

    var streaks = positions.map(function(position) {
        return movePiece.getStreak(position);
    });

    streaks.forEach(function(streak) {

        if (streak.value == 'castrolol') {
            if (streak.size >= 3) {
                streak.moveThreshold = 2;
            } else {
                streak.moveThreshold = streak.size * 0.33;
            }
        } else {
            if (streak.size >= 3) {
                streak.moveThreshold = 1.6;
            } else {
                streak.moveThreshold = streak.size * .35;
            }
        }

    });

    return streaks.sort(function(streakA, streakB) {
        return streakB.moveThreshold - streakA.moveThreshold;
    });

};

Algorithm.prototype.prepareGameBoard = function(gameBoard) {
    gameBoard.forEach(function(col) {
        col.reverse();
    });
    var isFirst = false;
    if (this.pieceMap == null) {
        isFirst = this.initializeMap(gameBoard);
    } else {
        this.updateMap(gameBoard);
    }
    return isFirst;
};

Algorithm.prototype.getPossibleMoves = function(availableColumns) {
    var getEmpty = this.getEmptyOfCol.bind(this);

    return availableColumns.map(getEmpty).filter(function(move) {
        return move;
    });
};

Algorithm.prototype.calcMovesThresholds = function(possibleMoves) {
    var analyzeMove = this.analyzeMove.bind(this);
    return possibleMoves.map(function(possibleMove) {
        return analyzeMove(possibleMove)[0];
    }).sort(function(dataA, dataB) {
        return dataB.moveThreshold - dataA.moveThreshold;
    });
};

Algorithm.prototype.move = function(availableColumns, gameBoard) {

    var isFirst = this.prepareGameBoard(gameBoard);
    
    if (isFirst) {
        return availableColumns[Math.floor(availableColumns.length / 2)];
    }

    var possibleMoves = this.getPossibleMoves(availableColumns);

    var movesWithThresholds = this.calcMovesThresholds(possibleMoves);

    var moveData = movesWithThresholds[0];

    if (moveData) {
        return moveData.piece.y;
    }

    return availableColumns[Math.round(availableColumns.length / 2)];
};
