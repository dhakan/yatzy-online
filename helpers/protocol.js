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

	PEER_CONNECTED: "connection",
	PEER_DISCONNECTED: "disconnect"
};

module.exports = protocol;