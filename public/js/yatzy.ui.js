/*jslint browser:true */
/*global yatzy: false, $: false, alert: false, confirm: false, console: false, Debug: false, opera: false, prompt: false, WSH: false */

$(function() {
	"use strict";
	var scoreTable = $("#scoreTable"),
		rulesTable = $("#rulesTable"),
		dicePanel = $("#dicePanel"),
		$diceImages = $("#imgList img"),
		$rollButton = $("#rollBtn"),
		playerForm = $("#playerForm"),
		$submitPlayerNameBtn = $("#submitPlayerNameBtn"),
		$players = $("#players"),
		$networkLog = $("#networkLog"),
		$onlineStatus = $("#onlineStatus"),
		submittedPlayerName,
		playerYatzyColumn,
		numberOfPlayerScoreboardCellsFilled,
		result;

	/* Whenever an image of a dice is clicked,
    mark it as either held or not held. */
	function diceClick() {
		// Do not let the player check the dices after the last(third) round has been played through.
		if (yatzy.logic.getRoundNumber() < 3) {
			var checkbox = $(this).next(),
				diceIndex = getClickedDiceIndex($(this));

			if (checkbox.is(":checked")) {
				unholdDice($(this));
				yatzy.websocket.unholdDice(diceIndex);
			} else {
				holdDice($(this));
				yatzy.websocket.holdDice(diceIndex);
			}
		}
	}

	function getClickedDiceIndex($dice) {
		var clickedDiceIndex;

		$dice
			.parent()
			.parent()
			.children()
			.each(function(index) {
				if ($(this)
					.children()
					.siblings(":first-child")
					.is($dice)) {
					clickedDiceIndex = index;
				}
			});

		return clickedDiceIndex;
	}

	function holdDice($dice) {
		$dice.animate({
			opacity: 0.2
		});

		$dice.next().prop("checked", true);
	}

	function unholdDice($dice) {
		$dice.animate({
			opacity: 1
		});

		$dice.next().prop("checked", false);
	}

	yatzy.websocket.onHoldDice(function(diceIndex) {
		var $dice = $("#imgList")
			.children(":nth-child(" + (diceIndex + 1) + ")")
			.find("img");
		holdDice($dice);
	});

	yatzy.websocket.onUnholdDice(function(diceIndex) {
		var $dice = $("#imgList")
			.children(":nth-child(" + (diceIndex + 1) + ")")
			.find("img");
		unholdDice($dice);
	});

	$rollButton.click(function() {
		var dice = yatzy.logic.getDices(),
			rollNr = yatzy.logic.getRoundNumber(),
			//playerColumn = yatzy.logic.getActiveColumnId(),
			dicesToThrowAgain = [];

		changePlayerColumnActiveState(false);

		// All dices need to be thrown in the first round.
		if (rollNr === 0) {
			yatzy.logic.rollAll();
			updateDiceImagesAndRollNumber(dice, rollNr);
			showDiceAndRollNumber();
			yatzy.websocket.showDice(dice);
		} else if (rollNr < 3) {

			// Traverses through all of the checkboxes.
			$("#imgList input").each(function(i) {
				if ($(this).is(":checked") === false) {
					dicesToThrowAgain.push(dice[i]);
				}
			});

			yatzy.logic.roll(dicesToThrowAgain);

			updateDiceImagesAndRollNumber(dice, rollNr);

			yatzy.websocket.updateDice({
				dice: dice,
				rollNumber: rollNr
			});
		}
	});

	function showDiceAndRollNumber() {
		$diceImages.css("visibility", "visible");

		fadeInDices();

		$("#roundText").animate({
			opacity: 1
		}, 500);
	}

	function updateDiceImagesAndRollNumber(dice, rollNumber) {
		var $imagesOfDiceRethrown = $("#imgList input:not(:checked)").prev(),
			firstTransitionDone = false;

		$("#imgList")
			.one("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {

				if (firstTransitionDone === false) {
					changeDiceImages(dice);
					setRoundText(rollNumber + 1);

					if (rollNumber === 2) {
						fadeInDices();
					}

					firstTransitionDone = true;
				}
			});

		$imagesOfDiceRethrown
			.each(function() {
				var $imageOfDiceRethrown = $(this),
					randomRotateValue = Math.ceil(Math.random() * 30) - 15;

				if ($imageOfDiceRethrown.data("hasBeenRotated")) {

					$imageOfDiceRethrown.css("transform", "rotateX(0deg) rotateY(0deg) rotate(" + randomRotateValue + "deg)");
					$imageOfDiceRethrown.data("hasBeenRotated", false);
				} else {
					$imageOfDiceRethrown.css("transform", "rotateX(1080deg) rotateY(1080deg) rotate(" + randomRotateValue + "deg)");
					$imageOfDiceRethrown.data("hasBeenRotated", true);
				}
			});
	}

	yatzy.websocket.onShowDice(function(dice) {
		updateDiceImagesAndRollNumber(dice, 0);
		showDiceAndRollNumber();
	});

	yatzy.websocket.onUpdateDice(function(data) {
		updateDiceImagesAndRollNumber(data.dice, data.rollNumber);
	});

	yatzy.websocket.onConnectedSuccessfully(function() {
		$onlineStatus.removeClass("offline").addClass("online").text("ONLINE");

		logNewMessage("You are now connected");
	});

	yatzy.websocket.onDisconnected(function() {
		$onlineStatus.removeClass("online").addClass("offline").text("OFFLINE");

		logNewMessage("You disconnected");
	});

	yatzy.websocket.onPlayersConnected(function(players) {
		for (var i = 0; i < players.length; i++) {
			var li = $("<li>").text(players[i].name);
			$players.append(li);
		}
	});

	yatzy.websocket.onPlayerConnected(function(player) {
		var li = $("<li>").text(player.name);
		$players.append(li);

		if (submittedPlayerName !== undefined) {
			activatePlayButton();
		}

		logNewMessage("A new player " + player.name + " connected");
	});

	yatzy.websocket.onPlayerDisconnected(function(player) {
		$players
			.children()
			.each(function() {
				var $player = $(this);

				if ($player.text() === player.name) {
					$player.remove();
				}
			});

		if ($players.children().length === 0) {
			inactivatePlayButton();
		}

		if (player.wasInGame) {
			dicePanel.hide();
			playerForm.show();
			$(".scoreBoardCells").remove();
		}

		logNewMessage("A player " + player.name + " disconnected");
	});

	yatzy.websocket.onPlayGameWithYourRoundFirst(function(data) {
		prepareOnlineGame(data);

		changeDicePanelActiveState(false);

		logNewMessage("A game has been initiated and you are playing the first round");
	});

	yatzy.websocket.onPlayGame(function(data) {
		prepareOnlineGame(data);

		changePlayerColumnActiveState(true);
		changeDicePanelActiveState(true);

		logNewMessage("A game has been initiated");
	});

	function prepareOnlineGame(data) {
		playerYatzyColumn = data.yatzyColumn;
		numberOfPlayerScoreboardCellsFilled = 0;
		playerForm.hide();
		dicePanel.show();
		$(".scoreBoardCells").remove();
		setUpPlayerColumns(data.players);
		yatzy.logic.playGame(data.players);
		$diceImages.css("visibility", "hidden").css("opacity", 0);
		$("#roundText").css("opacity", 0);
		$("#imgList input").prop("checked", false);
	}

	yatzy.websocket.onPlayerNameAlreadyChosenByYourself(function(playerName) {
		logNewMessage("You have already submitted this name(" + playerName + "), alter it and resubmit if you wish to change it!");
	});

	yatzy.websocket.onPlayerNameAlreadyChosenByOtherPlayer(function(playerName) {
		logNewMessage("Your submitted player name(" + playerName + ") has already been chosen by an opponent, please choose another one!");
	});

	yatzy.websocket.onPlayerChangedName(function(player) {
		$players
			.children()
			.each(function() {
				var $player = $(this);
				if ($player.text() === player.oldName) {
					$player.text(player.newName);
				}
			});

		logNewMessage("A player " + player.oldName + " has changed its name to " + player.newName);
	});

	yatzy.websocket.onPlayerNameSubmittedSuccessfully(function(playerName) {
		if (submittedPlayerName === undefined) {
			logNewMessage("Your name was submitted successfully");
		} else {
			logNewMessage("Your name was changed successfully");
		}

		submittedPlayerName = playerName;

		if ($players.children().length >= 1) {
			activatePlayButton();
		}

		$submitPlayerNameBtn.val("Change Name");
	});

	$submitPlayerNameBtn.click(function() {
		var playerName = $("#playerNameInput").val();
		if (playerName.length === 0) {
			logNewMessage("The name field cannot be empty!");
		} else {
			yatzy.websocket.submitPlayerName(playerName);
		}
	});

	$("#playBtn").click(function() {
		yatzy.websocket.initiateGame();
	});

	function activatePlayButton() {
		$("#playBtn").prop("disabled", false);
		$("#playBtn").css("opacity", 1);
	}

	function inactivatePlayButton() {
		$("#playBtn").prop("disabled", true);
		$("#playBtn").css("opacity", 0.2);
	}

	function setUpPlayerColumns(players) {
		var currentRow,
			td;

		// For each row in the scoretable.
		$("#scoreTable tr").each(function(i) {
			currentRow = $(this);
			if (i === 0) {
				for (var j = 0; j < players.length; j++) {
					td = $("<td>");
					td.text(players[j].name.substring(0, 1).toUpperCase());

					td.addClass("scoreBoardCells");
					currentRow.append(td);
				}
			} else {
				for (var j = 0; j < players.length; j++) {
					td = $("<td>");
					td.text("");
					td.addClass("scoreBoardCells");
					currentRow.append(td);
					// Add listeners to rows which carries a combination,
					// i.e not SUBTOTAL, TOTAL nor BONUS.
					if (!$(currentRow).hasClass("noClickRow")) {
						td.hover(scoreBoardCellHover);
						td.mouseleave(scoreBoardCellMouseLeave);
						td.click(scoreBoardCellClick);
					}
				}
			}
		});
	}

	function scoreBoardCellHover() {
		if (!$(this).hasClass("clicked") && ($(this).hasClass("activeCellInColumn"))) {
			var rowId = $(this).siblings(":first-child").text();

			result = yatzy.logic.validateDices(rowId);

			result = result === 0 ? "/" : result;

			hoverScoreboardCell($(this), result);

			yatzy.websocket.hoverScoreboardCell({
				rowId: rowId,
				score: result,
				yatzyColumn: playerYatzyColumn
			});
		}
	}

	yatzy.websocket.onHoverScoreboardCell(function(scoreboardCell) {
		$("#scoreTable tr :nth-child(" + (scoreboardCell.yatzyColumn + 2) + ")")
			.each(function() {
				var $scoreboardCell = $(this),
					rowId = $scoreboardCell.siblings(":first-child").text();

				if (rowId === scoreboardCell.rowId) {
					hoverScoreboardCell($scoreboardCell, scoreboardCell.score);
				}
			});
	});

	yatzy.websocket.onUnhoverScoreboardCell(function(scoreboardCell) {
		$("#scoreTable tr :nth-child(" + (scoreboardCell.yatzyColumn + 2) + ")")
			.each(function() {
				var $scoreboardCell = $(this),
					rowId = $scoreboardCell.siblings(":first-child").text();

				if (rowId === scoreboardCell.rowId) {
					unhoverScoreboardCell($scoreboardCell);
				}
			});
	});

	function hoverScoreboardCell($scoreboardCell, score) {
		$scoreboardCell.css("opacity", 0.4);
		$scoreboardCell.text(score);
	}

	function unhoverScoreboardCell($scoreboardCell) {
		$scoreboardCell.text("");
	}

	function scoreBoardCellMouseLeave() {
		if (!$(this).hasClass("clicked") && ($(this).hasClass("activeCellInColumn"))) {
			unhoverScoreboardCell($(this));

			var rowId = $(this)
				.siblings(":first-child")
				.text();

			yatzy.websocket.unhoverScoreboardCell({
				rowId: rowId,
				yatzyColumn: playerYatzyColumn
			});
		}
	}

	function scoreBoardCellClick() {
		var $subTotalCell,
			$bonusCell,
			$clickedScoreboardCell = $(this),
			numOfClickedCellsInUpperSection,
			clickedScoreboardCellToSendToOtherPlayers,
			subTotalCellToSendToOtherPlayers,
			bonusCellToSendToOtherPlayers,
			scoreboardCellsToSendToOtherPlayers = [],
			playerFinalScore,
			totalCellToSendToOtherPlayers;

		if (!$clickedScoreboardCell.hasClass("clicked") &&
			($clickedScoreboardCell.hasClass("activeCellInColumn"))) {

			numberOfPlayerScoreboardCellsFilled++;

			saveScoreboardCellValue($clickedScoreboardCell);

			var clickedScoreboardCellRowId = $clickedScoreboardCell
				.siblings(":first-child")
				.text();

			updateSubTotalScore($clickedScoreboardCell);

			scoreboardCellsToSendToOtherPlayers.push({
				rowId: clickedScoreboardCellRowId,
				yatzyColumn: playerYatzyColumn,
				score: $clickedScoreboardCell.text()
			});

			subTotalCellToSendToOtherPlayers &&
				scoreboardCellsToSendToOtherPlayers.push(subTotalCellToSendToOtherPlayers);

			bonusCellToSendToOtherPlayers &&
				scoreboardCellsToSendToOtherPlayers.push(bonusCellToSendToOtherPlayers);

			if (numberOfPlayerScoreboardCellsFilled === 15) {
				playerFinalScore = getPlayerFinalScore();

				$("#totalRow :nth-child(" + (playerYatzyColumn + 2) + ")")
					.text(playerFinalScore);

				totalCellToSendToOtherPlayers = {
					rowId: "TOTAL",
					yatzyColumn: playerYatzyColumn,
					score: getPlayerFinalScore()
				};

				scoreboardCellsToSendToOtherPlayers.push(totalCellToSendToOtherPlayers);
			}

			resetStateOfDiceAndRoundNumber();

			yatzy.websocket.saveScoreboardCellValues(scoreboardCellsToSendToOtherPlayers);

			if (totalCellToSendToOtherPlayers !== undefined) {
				yatzy.websocket.playerColumnComplete({
					yatzyColumn: playerYatzyColumn,
					finalScore: playerFinalScore
				});
			}
		}

		// Updates the subtotal score
		function updateSubTotalScore($clickedCell) {
			if ($clickedCell.parent().hasClass("upperSection")) {
				$subTotalCell = $("#subTotalRow :nth-child(" + (playerYatzyColumn + 2) + ")");
				$subTotalCell.text(Number($subTotalCell.text()) + (result === "/" ? 0 : result));

				subTotalCellToSendToOtherPlayers = {
					rowId: "SUBTOTAL",
					yatzyColumn: playerYatzyColumn,
					score: $subTotalCell.text()
				};

				checkBonus();
			}

			// Checks whether or not the player has a bonus, and updates the bonus cell accordingly
			function checkBonus() {
				$bonusCell = $("#bonusRow :nth-child(" + (playerYatzyColumn + 2) + ")");
				numOfClickedCellsInUpperSection = $(".upperSection .clicked:nth-child(" + (playerYatzyColumn + 2) + ")").length;

				var hasBonus = Number($subTotalCell.text()) >= 63,
					upperSectionIsComplete = numOfClickedCellsInUpperSection === 6;

				if (hasBonus || upperSectionIsComplete) {
					if (hasBonus) {
						$bonusCell.text(50);
					} else {
						$bonusCell.text("/");
					}

					bonusCellToSendToOtherPlayers = {
						rowId: "BONUS",
						yatzyColumn: playerYatzyColumn,
						score: $bonusCell.text()
					};
				}
			}
		}
	}

	function assembleWinnersText(players, numberOfPlayersInvolvedInTie) {
		var winnersText = "The winner is ",
			finalScore = players[0].finalScore;

		if (numberOfPlayersInvolvedInTie === undefined) {
			winnersText += players[0].name + " with a score of " + finalScore;
		} else {
			winnersText = "The winners are ";

			for (var i = 0; i < numberOfPlayersInvolvedInTie; i++) {
				winnersText += players[i].name + (i < numberOfPlayersInvolvedInTie - 1 ? ", " : "");
			}

			winnersText += " with a score of " + finalScore;
		}

		return winnersText;
	}

	yatzy.websocket.onGameComplete(function(data) {
		dicePanel.hide();
		playerForm.show();

		var winnersText = assembleWinnersText(data.players, data.numberOfPlayersInvolvedInTie);

		logNewMessage(winnersText);
	});

	yatzy.websocket.onGameAlreadyPlaying(function(roundsLeft) {
		logNewMessage("A game is currently running with " + roundsLeft + " rounds left to play");
	});

	yatzy.websocket.onSaveScoreboardCellValues(function(scoreboardCells) {
		$("#scoreTable tr :nth-child(" + (scoreboardCells[0].yatzyColumn + 2) + ")")
			.each(function() {
				var $scoreboardCell = $(this),
					rowId = $scoreboardCell
					.siblings(":first-child")
					.text();

				for (var i = 0; i < scoreboardCells.length; i++) {
					if (rowId === scoreboardCells[i].rowId) {
						saveScoreboardCellValue($scoreboardCell, scoreboardCells[i].score);
					}
				}
			});
	});

	function saveScoreboardCellValue($scoreboardCell, score) {
		$scoreboardCell.addClass("clicked");
		$scoreboardCell.fadeTo("fast", 1);

		if (score !== undefined) {
			$scoreboardCell.text(score);
		}
	}

	function resetStateOfDiceAndRoundNumber() {
		fadeOutDices();

		$("#roundText").animate({
			opacity: 0
		}, 500, function() {
			$(this).text("");
		});

		$("#imgList input").prop("checked", false);
	}

	yatzy.websocket.onPlayNextRound(function(playerTurn) {
		var isYourTurn = playerYatzyColumn === playerTurn;

		if (isYourTurn) {
			changeDicePanelActiveState(false);
		} else {
			changeDicePanelActiveState(true);
			changePlayerColumnActiveState(true);
		}

		yatzy.logic.nextGameRound();

		resetStateOfDiceAndRoundNumber();
	});

	function fadeInDices() {
		"use strict";
		$diceImages.animate({
			opacity: 1
		}, 500);
	}

	function fadeOutDices() {
		$diceImages.animate({
			opacity: 0
		}, 500, function() {
			$diceImages.css("visibility", "hidden");
		});
	}

	function changeDicePanelActiveState(inactivate) {

		$("#dicePanel input").prop("disabled", inactivate);

		if (inactivate) {
			$rollButton.css("opacity", 0.2);
			$diceImages.off("click", diceClick);
		} else {
			$rollButton.css("opacity", 1);
			$diceImages.on("click", diceClick);
		}
	}

	function changePlayerColumnActiveState(inactivate) {
		$("#scoreTable tr :nth-child(" + (playerYatzyColumn + 2) + ")")
			.each(function() {
				if (!$(this).parent().hasClass("noClickRow")) {
					if (inactivate) {
						$(this).removeClass("activeCellInColumn");
					} else {
						$(this).addClass("activeCellInColumn");
					}
				}
			});
	}

	function changeDiceImages(dice) {
		"use strict";
		$diceImages.each(function(i) {
			$(this).prop("src", "resources/d" + dice[i].val + ".png");
		});
	}

	function getPlayerFinalScore() {
		"use strict";
		var playerTotalScore = 0;

		$(".totalScore :nth-child(" + (playerYatzyColumn + 2) + ")")
			.each(function() {
				var $scoreboardCell = $(this),
					scoreboardCellScore = $scoreboardCell.text();

				playerTotalScore += scoreboardCellScore === "/" ? 0 : Number(scoreboardCellScore);
			});

		return playerTotalScore;
	}

	function logNewMessage(message) {
		var $li = $("<li>").text(message);

		// if ($networkLog.children().length >= 5) {
		// 	$networkLog.find(":last-child").remove();
		// }

		$networkLog.prepend($li);

		$li.css("transform", "rotateX(90deg)");
		$li.offset(); // Needed because of css transition not working properly along with prepend
		$li.css("transform", "rotateX(0deg)");
	}
});

function setRoundText(rollNr) {
	"use strict";
	$("#roundText").text("ROLL " + rollNr);
}

function setPlayerName(name) {
	"use strict";
	$("#playerName").text(name);
}