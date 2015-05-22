var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

var shuffle = require("./helpers/shuffle");
var protocol = require("./helpers/protocol");

app.use(express.static(__dirname + "/public"));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

// GENERAL
var players = [],
	sockets = [];

// PER GAME
var playersInGame,
	socketsInGame,
	playerTurn,
	fullRoundsPlayed,
	playerColumnsCompleted,
	playing = false;

io.on(protocol.PEER_CONNECTED, function(socket) {
	console.log("A user connected...");

	socket.emit(protocol.PLAYERS_CONNECTED, players);

	socket.on(protocol.PLAYER_NAME, function(playerName) {

		function getPlayerIsNew(name) {
			for (var i = 0; i < players.length; i++) {
				if (name === players[i].name) {
					return false;
				}

				if (socket.id === players[i].id) {
					return false;
				}
			}
			return true;
		}

		function getNameIsAlreadyChosenByYourself(name) {
			for (var i = 0; i < players.length; i++) {
				if (socket.id === players[i].id &&
					name === players[i].name) {
					return true;
				}
			}
			return false;
		}

		function getNameIsAlreadyChosenByOtherPlayer(name) {
			for (var i = 0; i < players.length; i++) {
				if (socket.id !== players[i].id &&
					name === players[i].name) {
					return true;
				}
			}
			return false;
		}

		function getPlayerAfterNameHasBeenChanged(name) {
			for (var i = 0; i < players.length; i++) {
				if (socket.id === players[i].id) {
					var oldPlayerName = players[i].name;
					players[i].name = name;

					var player = {
						oldName: oldPlayerName,
						newName: players[i].name
					};

					return player;
				}
			}
			return undefined;
		}

		if (getPlayerIsNew(playerName)) {

			var player = {
				id: socket.id,
				name: playerName,
				yatzyColumn: undefined,
				finalScore: undefined
			};

			sockets.push(socket);
			players.push(player);

			socket.emit(protocol.PLAYER_NAME_SUBMITTED_SUCCESSFULLY, playerName);
			socket.broadcast.emit(protocol.PLAYER_CONNECTED, player);

		} else if (getNameIsAlreadyChosenByYourself(playerName)) {
			socket.emit(protocol.PLAYER_NAME_ALREADY_CHOSEN_BY_YOURSELF, playerName);

		} else if (getNameIsAlreadyChosenByOtherPlayer(playerName)) {
			socket.emit(protocol.PLAYER_NAME_ALREADY_CHOSEN_BY_OTHER_PLAYER, playerName);

		} else {
			var playerWithNameChanged = getPlayerAfterNameHasBeenChanged(playerName);
			socket.emit(protocol.PLAYER_NAME_SUBMITTED_SUCCESSFULLY, playerWithNameChanged.newName);
			socket.broadcast.emit(protocol.PLAYER_CHANGED_NAME, playerWithNameChanged);
		}
	});

	socket.on(protocol.INITIATE_GAME, function() {

		function getPlayerIsRegisteredWithName() {
			for (var i = 0; i < players.length; i++) {
				if (players[i].id === socket.id) {
					return true;
				}
			}
			return false;
		}

		function setPlayersYatzyColumnsAndEmitStartingOfGame() {
			for (var i = 0; i < playersInGame.length; i++) {
				for (var j = 0; j < socketsInGame.length; j++) {

					var socketBelongsToPlayer = playersInGame[i].id === socketsInGame[j].id;

					playersInGame[i].yatzyColumn = i;

					if (socketBelongsToPlayer && i === 0) {
						socketsInGame[j].emit(protocol.PLAY_GAME_YOUR_ROUND_FIRST, {
							players: playersInGame,
							yatzyColumn: i
						});
					} else if (socketBelongsToPlayer) {
						socketsInGame[j].emit(protocol.PLAY_GAME, {
							players: playersInGame,
							yatzyColumn: i
						});
					}
				}
			}
		}

		var initiateGame = getPlayerIsRegisteredWithName() && playing === false;

		if (initiateGame) {

			playerTurn = 0;
			playerColumnsCompleted = 0;
			fullRoundsPlayed = 0;
			playersInGame = players.slice();
			playersInGame.shuffle();
			socketsInGame = sockets.slice();
			playing = true;

			setPlayersYatzyColumnsAndEmitStartingOfGame();
		} else {
			var roundsLeft = 15 - fullRoundsPlayed;
			socket.emit(protocol.GAME_ALREADY_PLAYING, roundsLeft);
		}
	});

	socket.on(protocol.SHOW_DICE, function(dice) {
		playing && socket.broadcast.emit(protocol.SHOW_DICE, dice);
	});

	socket.on(protocol.UPDATE_DICE, function(data) {
		playing && socket.broadcast.emit(protocol.UPDATE_DICE, data);
	});

	socket.on(protocol.HOLD_DICE, function(diceIndex) {
		playing && socket.broadcast.emit(protocol.HOLD_DICE, diceIndex);
	});

	socket.on(protocol.UNHOLD_DICE, function(diceIndex) {
		playing && socket.broadcast.emit(protocol.UNHOLD_DICE, diceIndex);
	});

	socket.on(protocol.HOVER_SCOREBOARD_CELL, function(scoreboardCell) {
		playing && socket.broadcast.emit(protocol.HOVER_SCOREBOARD_CELL, scoreboardCell);
	});

	socket.on(protocol.UNHOVER_SCOREBOARD_CELL, function(scoreboardCell) {
		playing && socket.broadcast.emit(protocol.UNHOVER_SCOREBOARD_CELL, scoreboardCell);
	});

	socket.on(protocol.SAVE_SCOREBOARD_CELL_VALUES, function(scoreboardCells) {
		if (playing &&
			scoreboardCells.length > 0 &&
			scoreboardCells[0].yatzyColumn === playerTurn) {

			socket.broadcast.emit(protocol.SAVE_SCOREBOARD_CELL_VALUES, scoreboardCells);

			if (playerTurn === playersInGame.length - 1) {
				fullRoundsPlayed++;
				playerTurn = 0;
			} else {
				playerTurn++;
			}

			for (var i = 0; i < socketsInGame.length; i++) {
				socketsInGame[i].emit(protocol.PLAY_NEXT_ROUND, playerTurn);
			}
		}
	});

	socket.on(protocol.PLAYER_COLUMN_COMPLETE, function(data) {

		function getPlayersSortedByFinalScore() {
			var playersSortedByFinalScore = playersInGame.sort(function(player1, player2) {
				if (player1.finalScore < player2.finalScore) {
					return 1;
				} else if (player1.finalScore > player2.finalScore) {
					return -1;
				} else {
					return 0;
				}
			});

			return playersSortedByFinalScore;
		}

		function getNumberOfPlayersInvolvedInTie(playersSortedByFinalScore) {
			var tieCounter = 0,
				tieScore = playersSortedByFinalScore[0].finalScore;

			for (var i = 0; i < playersSortedByFinalScore - 1; i++) {
				if (playersSortedByFinalScore[i].finalScore === playersSortedByFinalScore[i + 1] &&
					playersSortedByFinalScore[i].finalScore === tieScore) {
					tieCounter++;
				}
			}

			return tieCounter;
		}

		if (playing) {
			playerColumnsCompleted++;

			for (var i = 0; i < playersInGame.length; i++) {
				var player = playersInGame[i];

				if (player.yatzyColumn === data.yatzyColumn) {
					player.finalScore = data.finalScore;
				}
			}

			if (playerColumnsCompleted === playersInGame.length) {
				var playersSortedByFinalScore = getPlayersSortedByFinalScore(),
					numberOfPlayersInvolvedInTie = getNumberOfPlayersInvolvedInTie(playersSortedByFinalScore);

				var gameCompleteData = {
					players: playersSortedByFinalScore
				};

				if (numberOfPlayersInvolvedInTie > 0) {
					gameCompleteData.numberOfPlayersInvolvedInTie = numberOfPlayersInvolvedInTie;
				}

				io.emit(protocol.GAME_COMPLETE, gameCompleteData);

				playing = false;
			}
		}
	});

	socket.on(protocol.PEER_DISCONNECTED, function(reason) {

		function clearPlayerFromServer() {
			var playerWithNameSubmitted;

			for (var i = 0; i < players.length; i++) {
				if (players[i].id === socket.id) {
					playerWithNameSubmitted = players[i];
					players.splice(i, 1);
				}
			}

			for (var i = 0; i < sockets.length; i++) {
				if (sockets[i].id === socket.id) {
					sockets.splice(i, 1);
				}
			}

			return playerWithNameSubmitted;
		}

		function clearPlayerFromInGame() {
			var playerWasInGame;

			for (var i = 0; i < playersInGame.length; i++) {
				if (playersInGame[i].id === socket.id) {
					playerWasInGame = true;
					playersInGame.splice(i, 1);
				}
			}

			for (var i = 0; i < socketsInGame.length; i++) {
				if (socketsInGame[i].id === socket.id) {
					socketsInGame.splice(i, 1);
				}
			}

			return playerWasInGame;
		}

		if (playing) {
			var playerWasInGame = clearPlayerFromInGame();

			if (playerWasInGame) {
				playing = false;
			}
		}

		var playerWithNameSubmitted = clearPlayerFromServer();

		if (playerWithNameSubmitted !== undefined) {

			if (playerWasInGame) {
				playerWithNameSubmitted.wasInGame = true;
			}

			socket.broadcast.emit(protocol.PLAYER_DISCONNECTED, playerWithNameSubmitted);
		} else {
			console.log("Player disconnected without submitted name...");
		}
	});
});

http.listen(port, function() {
	console.log("listening on *:" + port);
});