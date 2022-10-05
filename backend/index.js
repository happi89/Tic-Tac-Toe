const http = require('http');
const sockets = require('socket.io');
require('dotenv').config();

const server = http.createServer();
const io = sockets(server, {
	cors: {
		origin: [
			'http://127.0.0.1:5500',
			'https://tic-tac-toe-rho-lilac.vercel.app/',
		],
		methods: ['GET', 'POST'],
	},
});

io.on('connection', (connection) => {
	connection.on('addPlayer', addPlayer(connection.id));
	connection.on('action', action(connection.id));
	connection.on('rematch', rematch(connection.id));
	connection.on('disconnect', disconnect(connection.id));
});

const Statuses = {
	WAITING: 'waiting',
	PLAYING: 'playing',
	DRAW: 'draw',
	WIN: 'win',
};

const winPatterns = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6],
];

let gameState = {
	board: new Array(9).fill(null),
	currentPlayer: null,
	players: [],
	result: {
		status: Statuses.WAITING,
	},
};

const addPlayer = (socketId) => {
	return (data) => {
		const numberOfPlayers = gameState.players.length;
		if (numberOfPlayers >= 2) {
			return;
		}

		let nextSymbol = 'X';
		if (numberOfPlayers === 1) {
			if (gameState.players[0].symbol === 'X') {
				nextSymbol = 'O';
			}
		}

		const newPlayer = {
			playerName: data.playerName,
			id: socketId,
			symbol: nextSymbol,
		};

		gameState.players.push(newPlayer);
		if (gameState.players.length === 2) {
			gameState.result.status = Statuses.PLAYING;
			gameState.currentPlayer = newPlayer;
		}
		io.emit('gameState', gameState);
	};
};

const action = (socketId) => {
	return (data) => {
		if (
			gameState.result.status === Statuses.PLAYING &&
			gameState.currentPlayer.id === socketId
		) {
			const player = gameState.players.find((p) => p.id === socketId);
			if (gameState.board[data.gridIndex] == null) {
				gameState.board[data.gridIndex] = player;
				gameState.currentPlayer = gameState.players.find((p) => p !== player);
				checkForEndOfGame();
			}
		}
		io.emit('gameState', gameState);
	};
};

const rematch = (socketId) => {
	return (data) => {
		if (gameState.players.findIndex((p) => p.id === socketId) < 0) return; // Don't let spectators rematch
		if (
			gameState.result.status === Statuses.WIN ||
			gameState.result.status === Statuses.DRAW
		) {
			resetGame();
			io.emit('gameState', gameState);
		}
	};
};

const resetGame = () => {
	gameState.board = new Array(9).fill(null);

	if (gameState.players.length === 2) {
		gameState.result.status = Statuses.PLAYING;
		const randPlayer = Math.floor(Math.random() * gameState.players.length);
		gameState.currentPlayer = gameState.players[randPlayer];
	} else {
		gameState.result.status = Statuses.WAITING;
		gameState.currentPlayer = null;
	}
};

const disconnect = (socketId) => {
	return (reason) => {
		gameState.players = gameState.players.filter((p) => p.id != socketId);
		if (gameState.players !== 2) {
			resetGame();
			io.emit('gameState', gameState);
		}
	};
};

const checkForEndOfGame = () => {
	gameState.players.forEach((player) => {
		winPatterns.forEach((seq) => {
			if (
				gameState.board[seq[0]] == player &&
				gameState.board[seq[1]] == player &&
				gameState.board[seq[2]] == player
			) {
				gameState.result.status = Statuses.WIN;
				gameState.result.winner = player;
			}
		});
	});

	if (gameState.result.status != Statuses.WIN) {
		const emptyBlock = gameState.board.indexOf(null);
		if (emptyBlock == -1) {
			gameState.result.status = Statuses.DRAW;
		}
	}
};

const PORT = process.env.PORT;

server.listen(PORT, function () {
	console.log('listening on port: ', PORT);
});
