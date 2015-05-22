yatzy.websocket = (function() {
	var socket = io();

	var protocol = {
		// CLIENT EMIT
		PLAYER_NAME: "player-name",
		INITIATE_GAME: "initiate-game",
		PLAYER_COLUMN_COMPLETE: "player-column-complete",

		// SERVER EMIT
		PLAYER_NAME_ALREADY_CHOSEN_BY_YOURSELF: "player-name-already-chosen-by-yourself",
		PLAYER_NAME_ALREADY_CHOSEN_BY_OTHER_PLAYER: "player-name-already-chosen-by-other-player",
		PLAYER_CHANGED_NAME: "player-changed-name",
		PLAYER_NAME_SUBMITTED_SUCCESSFULLY: "player-name-submitted-successfully",
		PLAY_GAME_YOUR_ROUND_FIRST: "play-game-your-round-first",
		PLAY_GAME: "play-game",
		PLAYER_CONNECTED: "player-connected",
		PLAYER_DISCONNECTED: "player-disconnected",
		PLAYERS_CONNECTED: "players-connected",
		PLAY_NEXT_ROUND: "play-next-round",
		GAME_COMPLETE: "game-complete",
		GAME_ALREADY_PLAYING: "game-already-playing",

		// CLIENT + SERVER EMIT
		SHOW_DICE: "show-dice",
		UPDATE_DICE: "update-dice",
		HOLD_DICE: "hold-dice",
		UNHOLD_DICE: "unhold-dice",
		HOVER_SCOREBOARD_CELL: "hover-scoreboard-cell",
		UNHOVER_SCOREBOARD_CELL: "unhover-scoreboard-cell",
		SAVE_SCOREBOARD_CELL_VALUES: "save-scoreboard-cell-values",

		CONNECTED_SUCCESSFULLY: "connect",
		DISCONNECTED: "disconnect"
	};

	return {
		submitPlayerName: function(playerName) {
			socket.emit(protocol.PLAYER_NAME, playerName);
		},
		initiateGame: function() {
			socket.emit(protocol.INITIATE_GAME);
		},
		showDice: function(dice) {
			socket.emit(protocol.SHOW_DICE, dice);
		},
		onShowDice: function(callback) {
			socket.on(protocol.SHOW_DICE, function(dice) {
				callback(dice);
			});
		},
		updateDice: function(data) {
			socket.emit(protocol.UPDATE_DICE, data);
		},
		onUpdateDice: function(callback) {
			socket.on(protocol.UPDATE_DICE, function(data) {
				callback(data);
			});
		},
		holdDice: function(diceIndex) {
			socket.emit(protocol.HOLD_DICE, diceIndex);
		},
		unholdDice: function(diceIndex) {
			socket.emit(protocol.UNHOLD_DICE, diceIndex);
		},
		onHoldDice: function(callback) {
			socket.on(protocol.HOLD_DICE, function(diceIndex) {
				callback(diceIndex);
			});
		},
		onUnholdDice: function(callback) {
			socket.on(protocol.UNHOLD_DICE, function(diceIndex) {
				callback(diceIndex);
			});
		},
		hoverScoreboardCell: function(scoreboardCell) {
			socket.emit(protocol.HOVER_SCOREBOARD_CELL, scoreboardCell);
		},
		unhoverScoreboardCell: function(scoreboardCell) {
			socket.emit(protocol.UNHOVER_SCOREBOARD_CELL, scoreboardCell);
		},
		onHoverScoreboardCell: function(callback) {
			socket.on(protocol.HOVER_SCOREBOARD_CELL, function(scoreboardCell) {
				callback(scoreboardCell);
			});
		},
		onUnhoverScoreboardCell: function(callback) {
			socket.on(protocol.UNHOVER_SCOREBOARD_CELL, function(scoreboardCell) {
				callback(scoreboardCell);
			});
		},
		saveScoreboardCellValues: function(scoreboardCells) {
			socket.emit(protocol.SAVE_SCOREBOARD_CELL_VALUES, scoreboardCells);
		},
		onSaveScoreboardCellValues: function(callback) {
			socket.on(protocol.SAVE_SCOREBOARD_CELL_VALUES, function(scoreboardCells) {
				callback(scoreboardCells);
			});
		},
		onPlayNextRound: function(callback) {
			socket.on(protocol.PLAY_NEXT_ROUND, function(playerTurn) {
				callback(playerTurn);
			});
		},
		playerColumnComplete: function(playerColumn) {
			socket.emit(protocol.PLAYER_COLUMN_COMPLETE, playerColumn);
		},
		onGameComplete: function(callback) {
			socket.on(protocol.GAME_COMPLETE, function(data) {
				callback(data);
			});
		},
		onGameAlreadyPlaying: function(callback) {
			socket.on(protocol.GAME_ALREADY_PLAYING, function(roundsLeft) {
				callback(roundsLeft);
			});
		},
		onConnectedSuccessfully: function(callback) {
			socket.on(protocol.CONNECTED_SUCCESSFULLY, function() {
				callback();
			});
		},
		onDisconnected: function(callback) {
			socket.on(protocol.DISCONNECTED, function() {
				callback();
			});
		},
		onPlayerNameAlreadyChosenByYourself: function(callback) {
			socket.on(protocol.PLAYER_NAME_ALREADY_CHOSEN_BY_YOURSELF, function(playerName) {
				callback(playerName);
			});
		},
		onPlayerNameAlreadyChosenByOtherPlayer: function(callback) {
			socket.on(protocol.PLAYER_NAME_ALREADY_CHOSEN_BY_OTHER_PLAYER, function(playerName) {
				callback(playerName);
			});
		},
		onPlayerChangedName: function(callback) {
			socket.on(protocol.PLAYER_CHANGED_NAME, function(player) {
				callback(player);
			});
		},
		onPlayerNameSubmittedSuccessfully: function(callback) {
			socket.on(protocol.PLAYER_NAME_SUBMITTED_SUCCESSFULLY, function(playerName) {
				callback(playerName);
			});
		},
		onPlayGameWithYourRoundFirst: function(callback) {
			socket.on(protocol.PLAY_GAME_YOUR_ROUND_FIRST, function(data) {
				callback(data);
			});
		},
		onPlayGame: function(callback) {
			socket.on(protocol.PLAY_GAME, function(data) {
				callback(data);
			});
		},
		onPlayerConnected: function(callback) {
			socket.on(protocol.PLAYER_CONNECTED, function(player) {
				callback(player);
			});
		},
		onPlayerDisconnected: function(callback) {
			socket.on(protocol.PLAYER_DISCONNECTED, function(player) {
				callback(player);
			});
		},
		onPlayersConnected: function(callback) {
			socket.on(protocol.PLAYERS_CONNECTED, function(players) {
				callback(players);
			});
		},
	};
}());