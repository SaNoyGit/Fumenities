// default settings
var cellSize = 22
var boardSize = [10, 20]

//BOARD
var board = []
var book = []
var undoLog = []
var redoLog = []
var bookPos = 0
var operation // {type: 'I', rotation: 'reverse', x: 4, y: 0}
var flags = {lock: true}
book = [{board: JSON.stringify(board), comment: '', operation: undefined, minoBoard: JSON.stringify(board), flags},]
bookPos = 0
window.requestAnimationFrame(render)

const names = 'ZLOSIJT'.split('')

//PIECE MAPS
piece_T = ['0000111001000000', '0100011001000000', '0100111000000000', '0100110001000000']
piece_I = ['', '0100010001000100', '0000111100000000']
piece_L = ['0000111010000000', '0100010001100000', '0010111000000000', '1100010001000000']
piece_J = ['0000111000100000', '0110010001000000', '1000111000000000', '0100010011000000']
piece_S = ['0000011011000000', '0100011000100000']
piece_Z = ['0000110001100000', '0010011001000000']
piece_O = ['0000110011000000']

pieces = [piece_T, piece_I, piece_L, piece_J, piece_S, piece_Z, piece_O]

//MAKING FIRST EMPTY BOARD
const aRow = []
const emptyBoard = []
for(let i = 0; i < boardSize[0]; i++) {aRow.push({ t: 0, c: '' })}
for (let i = 0; i < boardSize[1]; i++) {emptyBoard.push(aRow)}
board = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy
minoModeBoard = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy
updateBook()

// CANVAS
style = 'four'
var ctx = document.getElementById('b').getContext('2d')
var ctxH = document.getElementById('b').getContext('2d')
var ctxN = document.getElementById('b').getContext('2d')
var gridCvs = document.createElement('canvas')
gridCvs.height = cellSize
gridCvs.width = cellSize
var gridCtx = gridCvs.getContext('2d')
gridCtx.fillStyle = '#000000CC'
gridCtx.fillRect(0, 0, cellSize, cellSize)
gridCtx.strokeStyle = '#ffffff88'
gridCtx.strokeRect(0, 0, cellSize + 1, cellSize + 1)
var pattern = ctx.createPattern(gridCvs, 'repeat')
document.getElementById('b').height = (boardSize[1]) * cellSize
document.getElementById('b').width = boardSize[0] * cellSize
document.getElementById('b').style.outline = '2px solid #ffffffcc'

//USER INPUT
mouseY = 0
mouseX = 0
userFocus = false
mouseDown = false
drawMode = true
movingCoordinates = false
minoMode = false

//FUNCTIONS
document.getElementById('b').onmousedown = function mousedown(e) {
	bookPos = parseFloat(document.getElementById("positionDisplay").value)-1
	rect = document.getElementById('b').getBoundingClientRect()
	mouseY = Math.floor((e.clientY - rect.top) / cellSize)
	mouseX = Math.floor((e.clientX - rect.left) / cellSize)
	
	if(!mouseDown) {
		movingCoordinates = false
			//mino mode
		if (minoMode) {
			drawnCount = minoModeBoard.reduce((count,row) => {
				return count += row.reduce((xcount,cell) => {
					return xcount += (cell.t != 0)
				}, 0)
			}, 0)
			if (board[mouseY][mouseX].t != 1 && drawnCount != 4 && minoModeBoard[mouseY][mouseX].t != 1) {
				minoModeBoard[mouseY][mouseX] = {t: 1, c: "X"}
			} else {
				if(minoModeBoard[mouseY][mouseX].t == 1 && drawnCount == 4) {
					for (var row = 0; row < 20; row++){
						for (var col = 0; col < 10; col++) {
							if(minoModeBoard[row][col].c == ''){
							} else {
								minoModeBoard[row][col].c = 'X'
							}	
						}
					}
				}
				minoModeBoard[mouseY][mouseX] = {t: 0, c: ''}
			}
		} else {
			//auto color is basically mino mode and normal combined.
			if(autoColorBool) {			
				drawMode = e.button != 0 || board[mouseY][mouseX]['t'] == 2
				drawnCount = board.reduce((count,row) => {
					return count += row.reduce((xcount,cell) => {
						return xcount += (cell.t == 2)
					}, 0)
				}, 0)
				positions = []
				for (var row = 0; row < 20; row++){
					for (var col = 0; col < 10; col++) {
						if(board[row][col].t == 2){
							positions.push([row,col])
						}
					}
				}

				if (board[mouseY][mouseX]['t'] == 0 && drawnCount <= 3) {
					board[mouseY][mouseX] = { t: 2, c: 'X' }
				} else if(drawnCount <= 3){
					board[mouseY][mouseX] = { t: 0, c: '' }
				}
				
				if (board[mouseY][mouseX]['t'] == 0 && drawnCount == 4) {
					for (var cell = 0; cell < positions.length; cell++){
						let row = positions[cell][0]
						let col = positions[cell][1]
						board[row][col].t = 1
					}
					board[mouseY][mouseX] = { t: 2, c: 'X' }
				} else if(drawnCount == 4) {
					for (var cell = 0; cell < positions.length; cell++){
						let row = positions[cell][0]
						let col = positions[cell][1]
						board[row][col].c = 'X'
					}
					board[mouseY][mouseX] = { t: 0, c: '' }
				}

			//normal draw mode
			} else {
				drawMode = e.button != 0 || board[mouseY][mouseX]['t'] == 1
				if (board[mouseY][mouseX]['t'] == 0) {
					board[mouseY][mouseX] = { t: 1, c: paintbucketColor() }
				} else {
					if (board[mouseY][mouseX]['c'] != paintbucketColor()) {
						board[mouseY][mouseX] = { t: 1, c: paintbucketColor() }
					} else {
						board[mouseY][mouseX] = { t: 0, c: '' }
					}
				}
			}
		}
		updateBook()
		autoEncode()
	}
	mouseDown = true
	drawMode = board[mouseY][mouseX]['t'] == 1
}

document.getElementById('b').onmousemove = function mousemove(e) {
	bookPos = parseFloat(document.getElementById("positionDisplay").value)-1
	rect = document.getElementById('b').getBoundingClientRect()
	y = Math.floor((e.clientY - rect.top) / cellSize)
	x = Math.floor((e.clientX - rect.left) / cellSize)
		if (inRange(x, 0, boardSize[0]-1) && inRange(y, 0, boardSize[1]-1)) {
		movingCoordinates = y != mouseY || x != mouseX
		mouseY = y
		mouseX = x
        if (mouseDown && movingCoordinates) {
			//mino mode
			if (minoMode) {
				drawnCount = minoModeBoard.reduce((count,row) => {
					return count += row.reduce((xcount,cell) => {
						return xcount += (cell.t != 0)
					}, 0)
				}, 0)
                if (board[mouseY][mouseX].t != 1 && minoModeBoard[mouseY][mouseX].t != 1 && drawnCount < 4) {
                    minoModeBoard[mouseY][mouseX] = { t: 1, c: "X" }
	            } else {
					if(minoModeBoard[mouseY][mouseX].t == 1 && drawnCount == 4) {
						//remove colors when there are four minos and user deletes one
						for (var row = 0; row < 20; row++){
							for (var col = 0; col < 10; col++) {
								if(minoModeBoard[row][col].c != ''){
									minoModeBoard[row][col].c = 'X'
								}	
							}
						}
					}
					minoModeBoard[mouseY][mouseX] = {t: 0, c: ''}
				}
            } else {
				//auto color is basically mino an- :ResidentSleeper:
				if(autoColorBool) {
					drawnCount = board.reduce((count,row) => {
						return count += row.reduce((xcount,cell) => {
							return xcount += (cell.t == 2)
						}, 0)
					}, 0)
					positions = []
					for (var row = 0; row < 20; row++){
						for (var col = 0; col < 10; col++) {
							if(board[row][col].t == 2){
								positions.push([row,col])
							}
						}
					}

					if (board[mouseY][mouseX]['t'] == 0 && drawnCount <= 3) {
						board[mouseY][mouseX] = { t: 2, c: 'X' }
					} else if(drawnCount <= 3){
						board[mouseY][mouseX] = { t: 0, c: '' }
					}
				} else {
					//normal mode
					if (drawMode) {
						if (board[mouseY][mouseX]['t'] == 0) {
							board[mouseY][mouseX] = { t: 1, c: paintbucketColor() }
						} else {
							if (board[mouseY][mouseX]['c'] != paintbucketColor()) {
								board[mouseY][mouseX] = { t: 1, c: paintbucketColor() }
							}
						}
					} else {
						board[mouseY][mouseX] = { t: 0, c: '' }
					}
				}
			}
			updateBook()
			autoEncode()
		}
	}
}

document.onmouseup = function mouseup() {
    mouseDown = false
	drawn = []
	bookPos = document.getElementById("positionDisplay").value-1
	if (minoMode) {
		//count drawn pieces
		drawnCount = minoModeBoard.reduce((count,row) => {
			return count += row.reduce((tval,cell) => {
				return tval += (cell.t != 0)
			}, 0)
		}, 0)

		if(drawnCount == 4){
			//get all drawn cells + their coords
			for (var row = 0; row < 20; row++){
				for (var col = 0; col < 10; col++) {
					if(minoModeBoard[row][col].c == ''){
					} else {
						cellData = {row: row, col: col, info: minoModeBoard[row][col]}
						drawn.push(cellData)
					}	
				}
			}
			
			for(var cell = 0; cell < 4; cell++) {
				minoFieldString = ''
				//making map
				for(var y = -1; y < 3; y++){
					for(var x = -1; x < 3; x++){
						let row = drawn[cell]['row'] + y
						let col = drawn[cell]['col'] + x
						if(!inRange(row,0,19) || !inRange(col,0,9)) {
						minoFieldString += '0'
						} else {
						 	minoFieldString += minoModeBoard[row][col].t.toString()
						}
					}
				}
				//matching map to piece
				for(var piece = 0; piece < 7; piece++){
					pieceMap = pieces[piece]
					index = pieceMap.findIndex((pieceString) => pieceString === minoFieldString)
					if(index != -1){
						//operations property items
						type = 'TILJSZO'[piece]
						rotations = ['reverse','right','spawn','left']
						rotation = rotations[index]
						x = drawn[cell]['col']
						y = 19 - drawn[cell]['row']
						operation = new Mino(type, rotation, x, y)
						//coloring in
						for (var row = 0; row < 20; row++){
							for (var col = 0; col < 10; col++) {
								if(minoModeBoard[row][col].c == ''){
								} else {
									minoModeBoard[row][col].c = type
								}	
							}
						}
						//saving matched piece
						updateBook()
					}
				}
			}
		}
    }

	if(autoColorBool){
		positions = []
		for (var row = 0; row < 20; row++){
			for (var col = 0; col < 10; col++) {
				if(board[row][col].t == 2){
					positions.push([row,col])
				}
			}
		}

		result = readPiece(positions)
		//because why fix the readPiece function from reading upside down :kappa:
		switch(result){
			case 'S': result = 'Z'; break;
			case 'Z': result = 'S'; break;
			case 'L': result = 'J'; break;
			case 'J': result = 'L'; break;
			case undefined: result = 'X'; break;
			default: break;
		}

		for (var cell = 0; cell < positions.length; cell++){
			let row = positions[cell][0]
			let col = positions[cell][1]
			if(board[row][col].c == 'X' && positions.length % 4 == 0) board[row][col].c = result
		}
	}

	autoEncode()
    requestAnimationFrame(render)
}

function focused() {userFocus = true; console.log(userFocus)}
function unfocused() {userFocus = false; console.log(userFocus)}

document.onkeydown = function hotkeys(e) {
	console.log(e.key)
	if(userFocus == false){
		if(e.ctrlKey == true){
			switch (e.key) {
				case 'z': undo(); break;
				case 'y': redo(); break;
			}
		} else {
			switch (e.key) {
				case '1': paintbucket[0].checked = true; break;
				case '2': paintbucket[1].checked = true; break;
				case '3': paintbucket[2].checked = true; break;
				case '4': paintbucket[3].checked = true; break;
				case '5': paintbucket[4].checked = true; break;
				case '6': paintbucket[5].checked = true; break;
				case '7': paintbucket[6].checked = true; break;
				case '8': paintbucket[7].checked = true; break;
				case 'r': restart(); break;
				case ',': prevPage(); break;
				case '.': nextPage(); break;
				default: break;			
			}
		}
	}
}

function paintbucketColor() {
	for (i = 0; i < document.paintbucket.length; i++) {
		if (document.paintbucket[i].checked) {
			return document.paintbucket[i].id;
		}
	}
}

function inRange(number, min, max) {
    return (number >= min && number <= max)
}

// Updates all of the board properties: board, minoBoard, operation, comments
function updateBook() {
	bookPos = parseFloat(document.getElementById("positionDisplay").value)-1
	book[bookPos] = {
		board: JSON.stringify(board),
		minoBoard: JSON.stringify(minoModeBoard),
		comment: document.getElementById("commentBox").value,
		operation: operation,
		flags: {
			lock: document.getElementById("lockFlagInput").checked,
			},
	}

	if(book[bookPos]['comment'] == undefined){
		document.getElementById("commentBox").value = ''
	} else {
		document.getElementById("commentBox").value = book[bookPos]['comment']
	}

	//Generating 100 undo logs
	if(undoLog.length <= 100){
		undoLog.push(JSON.stringify(book))
	} else {
		undoLog.splice(0,1)
		undoLog.push(JSON.stringify(book))
	}
	//Clearing redo if branch is overwritten
	if(redoLog.length != 0) redoLog = [];

	autoColor()
	window.requestAnimationFrame(render)
}

function toggleMinoMode() {
    minoMode = document.getElementById("minoModeInput").checked
    if (minoMode) {
	} else {
		if(operation == undefined){
		minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
		operation = undefined
		updateBook()
		}
	}
}

function shift(direction){
	switch(direction) {
	case 'left':		
			board.map((y) => {
				y.splice(0,1)
				y.push({t: '0', c: ''})
			})
		break;
	case 'up':
			board.splice(0,1)
			board.push(JSON.parse(JSON.stringify(aRow)))
		break;
	case 'down':
			board.pop()
			board.splice(0,0,JSON.parse(JSON.stringify(aRow)))
		break;
	case 'right':
			board.map((y) => {
				y.splice(0,0,{t: '0', c: ''})
				y.pop()
			})
		break;
	}
	updateBook()
}

function prevPage() {
	bookPos = parseFloat(document.getElementById("positionDisplay").value)
	if (bookPos > 0) {
        board = JSON.parse(book[bookPos - 1]['board'])
        minoModeBoard = JSON.parse(book[bookPos - 1]["minoBoard"])
		document.getElementById("positionDisplay").value = bookPos
		document.getElementById("commentBox").value = book[bookPos - 1]['comment']
	}
	window.requestAnimationFrame(render)
	autoEncode()
}

function nextPage() {
	bookPos = parseFloat(document.getElementById("positionDisplay").value)-1
	if(bookPos < book.length) {
		board = JSON.parse(book[bookPos]['board'])
		minoModeBoard = JSON.parse(book[bookPos]['minoBoard'])
		comment = book[bookPos]['comment']
		flags = {lock: true}
	} else {
		// Solidifying minos
		prevBoard = JSON.parse(book[bookPos-1]['board'])
		for (var row = 0; row < 20; row++){
			for (var col = 0; col < 10; col++) {
				if(board[row][col].t == 2){
					prevBoard[row][col].t = 1
					prevBoard[row][col].c = board[row][col].c
				}
			}
		}
		book[bookPos-1]['board'] = JSON.stringify(prevBoard)

		if(book[bookPos-1]['operation'] != undefined){
			for (var row = 0; row < 20; row++){
				for (var col = 0; col < 10; col++) {
					if(minoModeBoard[row][col].t != 0){
						board[row][col] = minoModeBoard[row][col]
					}
				}
			}
		} else {
			board = JSON.parse(book[bookPos - 1]['board'])
		}

		//Line clears if flag lock is on
		if(book[bookPos-1]['flags']['lock'] === true) {
			rowSum = []
			//Check # of minos
			for(var row = 0; row < 20; row++){
				let cellCount = 0
				for(var col = 0; col < 10; col++){	
					cellCount += board[row][col].t
				}
				rowSum.push(cellCount)
			}
			//Clear lines
			for(var row = 0; row < 20; row++){
				if(rowSum[row] == 10) {
					board.splice(row, 1)
					board.splice(0, 0, aRow)
				}
			}
		}

		minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
		operation = undefined
		lockFlag = document.getElementById("lockFlagInput").checked
		comment = ''
		
		book[bookPos] = {
			board: JSON.stringify(board),
			minoBoard: JSON.stringify(emptyBoard),
			comment: '',
			operation: undefined,
			flags: {lock: lockFlag},
		}
	}
	document.getElementById("commentBox").value = comment
	document.getElementById("positionDisplayOver").value = "/"+(book.length)
	window.requestAnimationFrame(render)
	autoEncode()
	updateBook()
}

function startPage(){
	bookPos = 0
	board = JSON.parse(book[bookPos]['board'])
	minoModeBoard = JSON.parse(book[bookPos]['minoBoard'])
	window.requestAnimationFrame(render)
	autoEncode()
}

function endPage(){
	board = JSON.parse(book[book.length-1]['board'])
	minoModeBoard = JSON.parse(book[book.length-1]['minoBoard'])
	window.requestAnimationFrame(render)
	autoEncode()
}

function restart(){
	board.map((y, i) => {
		y.map((x, ii) => {
			x.t = 0
			x.c = ''
		})
    })
    minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
	book = []
	book[0] = [{board: JSON.stringify(board),},]
	document.getElementById("positionDisplay").value = 1
	document.getElementById("positionDisplayOver").value = "/"+(book.length)
	document.getElementById("boardOutput").value = ''
	document.getElementById("commentBox").value = ''
	comments = []
	window.requestAnimationFrame(render)
}

function clearPage(){
	bookPos = parseFloat(document.getElementById("positionDisplay").value)-1
	book[bookPos] = {
		board: JSON.stringify(emptyBoard),
		minoBoard: JSON.stringify(emptyBoard),
		comment: '',
		operation: undefined,
		flags: flags
	}
	window.requestAnimationFrame(render)
	document.getElementById("commentBox").value = ''
	autoEncode()
}

function dupliPage(){
	bookPos = parseFloat(document.getElementById("positionDisplay").value-1)
	if(book.length == 1){
		nextPage()
	} else {
		if (bookPos != book.length-1) {
			book.splice(bookPos,0,book[bookPos])
			document.getElementById("positionDisplay").value = bookPos+2
			document.getElementById("positionDisplayOver").value = "/"+book.length
			document.getElementById("commentBox").value = book[bookPos]['comment']
		} else {
			if(bookPos == book.length-1){
				nextPage()
			}
		}
	}
	window.requestAnimationFrame(render)
	autoEncode()
}

function deletePage(){
	bookPos = parseFloat(document.getElementById("positionDisplay").value-1)
	if(book.length == 1){
		clearPage()
	} else {
		if (bookPos != book.length-1) {
			board = JSON.parse(book[bookPos+1]['board'])
			document.getElementById("positionDisplay").value = bookPos+1
			book.splice(bookPos,1)
			document.getElementById("positionDisplayOver").value = "/"+book.length
		} else {
			if(bookPos == book.length-1){
				board = JSON.parse(book[bookPos-1]['board'])
				book.pop()
				document.getElementById("positionDisplay").value = bookPos
				document.getElementById("positionDisplayOver").value = "/"+book.length
			}
		}
	}
	window.requestAnimationFrame(render)
	autoEncode()
}

function render() {
	ctx.clearRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize)
	ctx.fillStyle = pattern
	ctx.fillRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize)
	board.map((y, i) => {
		y.map((x, ii) => {
			if (x.t != 0) {
				drawCell(ii, i, x.c, x.t)
			}
		})
	})
	minoModeBoard.map((y, i) => {
		y.map((x, ii) => {
			if(x.t == 1) {
				drawCell(ii, i, x.c, 2)
			}
		})
	})
}

function drawCell(x, y, piece, type) {
	var foureffectInput = document.getElementById("3dSetting").checked
	var lockFlag = document.getElementById("lockFlagInput").checked
	
	if(style == 'four'){
		var color = {Z: '#ef624d', L: '#ef9535', O: '#f7d33e', S: '#66c65c', I: '#41afde', J: '#1983bf', T: '#b451ac', X: '#999999'}
		var lightercolor = {Z: '#fd7660', L: '#fea440', O: '#ffe34b', S: '#7cd97a', I: '#3dc0fb', J: '#1997e3', T: '#d161c9', X: '#bbbbbb'}
		var lightestcolor = {Z: '#ff998c', L: '#feb86d', O: '#fbe97f', S: '#96f98b', I: '#75faf8', J: '#1fd7f7', T: '#fe89f7', X: '#dddddd'}
		if(y == 0){
			var cellAbove = 1
		} else {
			var cellAbove = (board[y-1][x]['t'] != 0) + (minoModeBoard[y-1][x]['t'] != 0)
		}

		if (type == 1) {
			//Normal colors
			if (cellAbove == 0){
				ctx.fillStyle = lightercolor[piece]
				if(foureffectInput){
					ctx.fillRect((x) * cellSize + 1, y * cellSize + 1 - cellSize/5, cellSize - 0, cellSize/5)
				}
			}
			ctx.fillStyle = color[piece]
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 0, cellSize - 0)
			//Light locked row colors
			if (lockFlag == true) {
				//check row mino count
				var cellCount = 0
				for(var col = 0; col < 10; col++){	
					cellCount += (board[y][col].t != 0)
					cellCount += (minoModeBoard[y][col].t != 0)
				}
				//color in if 10
				if(cellCount == 10){
					if (cellAbove != 1){
						ctx.fillStyle = lightestcolor[piece]
						if(foureffectInput){
							ctx.fillRect((x) * cellSize + 1, y * cellSize + 1 - cellSize/5, cellSize - 0, cellSize/5)
						}
					}
					ctx.fillStyle = lightercolor[piece]
					ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 0, cellSize - 0)
				}
			}
		}
		//Light mino colors
		if (type == 2) {
			if (cellAbove == 0){
				ctx.fillStyle = lightestcolor[piece]
				if(foureffectInput){
				ctx.fillRect((x) * cellSize + 1, y * cellSize + 1 - cellSize/5, cellSize - 0, cellSize/5)
				}
			}
			ctx.fillStyle = lightercolor[piece]
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 0, cellSize - 0)
		}
	}

	if(style == 'fumen'){
		var color = {Z: '#990000', L: '#996600', O: '#999900', S: '#009900', I: '#009999', J: '#0000bb', T: '#990099', X: '#999999'}
		var lightercolor = {Z: '#cc3333', L: '#cc9933', O: '#cccc33', S: '#33cc33', I: '#33cccc', J: '#3333cc', T: '#cc33cc', X: '#cccccc'}
		if (type == 1) {
			//Normal colors
			ctx.fillStyle = color[piece]
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1)
			//Light locked row colors
			if (lockFlag == true) {
				//check row mino count
				var cellCount = 0
				for(var col = 0; col < 10; col++){	
					cellCount += (board[y][col].t != 0)
					cellCount += (minoModeBoard[y][col].t != 0)
				}
				//color in if 10
				if(cellCount == 10){
					ctx.fillStyle = lightercolor[piece]
					ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1)
				}
			}
		}
		//Light mino colors
		if (type == 2) {
			ctx.fillStyle = lightercolor[piece]
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1)
		}
	}
}

var shape_table = {'Z': [[[1, 0], [0, 2], [1, 1], [0, 1]],  [[1, 0], [1, 1], [2, 1], [0, 0]]],
               'L': [[[1, 0], [0, 1], [2, 0], [0, 0]], [[0, 1], [0, 2], [1, 2], [0, 0]], [[0, 1], [1, 1], [2, 0], [2, 1]], [[1, 0], [1, 1], [1, 2], [0, 0]]],
               'O': [[[1, 0], [0, 1], [1, 1], [0, 0]]],
               'S': [[[0, 1], [1, 1], [1, 2], [0, 0]], [[1, 0], [1, 1], [2, 0], [0, 1]]],
               'I': [[[1, 0], [2, 0], [0, 0], [3, 0]],  [[0, 1], [0, 2], [0, 3], [0, 0]]],
               'J': [[[0, 1], [1, 1], [2, 1], [0, 0]], [[0, 1], [1, 0], [0, 2], [0, 0]], [[1, 0], [2, 0], [2, 1], [0, 0]], [[1, 0], [1, 1], [1, 2], [0, 2]]],
               'T': [[[0, 1], [0, 2], [1, 1], [0, 0]], [[1, 0], [1, 1], [2, 0], [0, 0]], [[1, 0], [1, 1], [1, 2], [0, 1]], [[1, 0], [1, 1], [2, 1], [0, 1]]],
}

//CONTRIBUTED BY CONFIDENTIAL (confidential#1288)
function readPiece(positions){
    if (positions.length != 4){
        return 'X'
    }
    var min_i=99
    var min_j=99
    
    for (position of positions){
        var j = position[0]
        var i = position[1]
        if (j < min_j){
            min_j = j
        }
            
        if (i < min_i){
            min_i = i
        }
            
    }
    var offset_positions = []

    for (var position of positions){
        j = position[0]
        i = position[1]
        offset_positions.push([j-min_j, i-min_i])
    }
    
    for (var piece in shape_table) {
        if (shape_table.hasOwnProperty(piece) && is_element(offset_positions, shape_table[piece])) {
            return piece
        }
    }

    function positions_equal(positions1, positions2){
        if (positions1.length != positions2.length){
            return false
        }
        for (var position1 of positions1){
            var found = false
            for (var position2 of positions2){
                if (position1[0] == position2[0] && position1[1] == position2[1]){
                    found = true
                }
            }
            if (found == false){
                return false
            }
        }
        return true
    }
    function is_element(positions1, query){
        for (var positions of query){
            if (positions_equal(positions1, positions)){
                return true
            }
        }
        return false
    }
            
}

function autoColor() {
	autoColorBool = document.getElementById("autoColorInput").checked
	if(autoColorBool == false){
		for (var row = 0; row < 20; row++){
			for (var col = 0; col < 10; col++) {
				if(board[row][col].t == 2){
					board[row][col].t = 1
				}
			}
		}
	}
}

function drawnCount(field) {
	count = field.reduce((count,row) => {
		return count += row.reduce((tval,cell) => {
			return tval += (cell.t != 0)
		}, 0)
	}, 0)
	return count
}