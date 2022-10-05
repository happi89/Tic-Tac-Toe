import kaboom from 'https://unpkg.com/kaboom/dist/kaboom.mjs';
const socket = io();

kaboom({
	background: [0, 0, 0],
	width: 2000,
	height: 1000,
});

scene('startGame', () => {
	const SCREEN_WIDTH = 2000;
	const SCREEN_HEIGHT = 1000;

	add([
		text("What's your name? ", { size: 32, font: 'sinko' }),
		pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3),
		origin('center'),
	]);

	const nameField = add([
		text('', { size: 32, font: 'sinko' }),
		pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2),
		origin('center'),
	]);

	onCharInput((ch) => {
		nameField.text += ch;
	});

	onKeyRelease('enter', () => {
		go('main', { playerName: nameField.text });
	});
});

go('startGame');

scene('main', ({ playerName }) => {
	// Board
	add([rect(1, 400), pos(233, 100)]);

	add([rect(1, 400), pos(366, 100)]);

	add([rect(400, 1), pos(100, 233)]);

	add([rect(400, 1), pos(100, 366)]);
});

const boardSquares = [
	{ index: 0, x: 100, y: 100, width: 133, height: 133 },
	{ index: 1, x: 233, y: 100, width: 133, height: 133 },
	{ index: 2, x: 366, y: 100, width: 133, height: 133 },
	{ index: 3, x: 100, y: 233, width: 133, height: 133 },
	{ index: 4, x: 233, y: 233, width: 133, height: 133 },
	{ index: 5, x: 366, y: 233, width: 133, height: 133 },
	{ index: 6, x: 100, y: 366, width: 133, height: 133 },
	{ index: 7, x: 233, y: 366, width: 133, height: 133 },
	{ index: 8, x: 366, y: 366, width: 133, height: 133 },
];

function createTextBoxesForGrid() {
	boardSquares.forEach((square) => {
		let x = square.x + square.width * 0.5;
		let y = square.y + square.height * 0.5;
		square.textBox = add([text('', 40), pos(x, y), origin('center')]);
	});
}

createTextBoxesForGrid();

const playerOneLabel = add([
	text('', { size: 20, font: 'sinko' }),
	pos(600, 100),
]);

const playerTwoLabel = add([
	text('', { size: 20, font: 'sinko' }),
	pos(600, 150),
]);

const statusLabel = add([
	text('', { size: 20, font: 'sinko' }),
	pos(600, 200),
	color(0, 255, 0),
]);

socket.on('connect', function () {
	socket.emit('addPlayer', {
		playerName: playerName,
	});
});

const Statuses = {
	WAITING: 'waiting',
	PLAYING: 'playing',
	DRAW: 'draw',
	WIN: 'win',
};

socket.on('gameState', function (state) {
	for (let index = 0; index < state.board.length; index++) {
		const player = state.board[index];
		if (player != null) {
			boardSquares[index].textBox.text = player.symbol;
		} else {
			boardSquares[index].textBox.text = '';
		}
	}

	statusLabel.text = '';
	switch (state.result.status) {
		case Statuses.WAITING:
			statusLabel.text = 'Waiting for players....';
			break;
		case Statuses.PLAYING:
			statusLabel.text = state.currentPlayer.playerName + ' to play';
			break;
		case Statuses.DRAW:
			statusLabel.text = 'Draw! \nPress R for rematch';
			break;
		case Statuses.WIN:
			statusLabel.text =
				state.result.winner.playerName + ' Wins! \nPress R for rematch';
			break;
		default:
			break;
	}

	playerOneLabel.text = '';
	playerTwoLabel.text = '';
	if (state.players.length > 0) {
		playerOneLabel.text =
			state.players[0].symbol + ': ' + state.players[0].playerName;
	}

	if (state.players.length > 1) {
		playerTwoLabel.text =
			state.players[1].symbol + ': ' + state.players[1].playerName;
	}
});

onMouseRelease(() => {
	const mpos = mousePos();
	for (let index = 0; index < boardSquares.length; index++) {
		const square = boardSquares[index];
		if (
			mpos.x > square.x &&
			mpos.x < square.x + square.width &&
			mpos.y > square.y &&
			mpos.y < square.y + square.height
		) {
			socket.emit('action', {
				gridIndex: square.index,
			});
			break;
		}
	}
});

onCharInput((ch) => {
	if (ch.toLowerCase() === 'r') {
		socket.emit('rematch', null);
	}
});
