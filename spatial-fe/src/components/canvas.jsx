import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

function Canvas({ floorplanImage }) {
    const sketchRef = useRef();
    const p5InstanceRef = useRef(null);

    useEffect(() => {
        if (!floorplanImage) {
            if (p5InstanceRef.current) {
                p5InstanceRef.current.remove();
                p5InstanceRef.current = null;
            }
            return;
        }

        if (p5InstanceRef.current) {
            p5InstanceRef.current.remove();
            p5InstanceRef.current = null;
        }

        const sketch = (p) => {
            let floorplanImg;
            let imgWidth, imgHeight;
            let rectangles = [];
            let walls = [];
            let pixelsPerCm;
            let cellSize = 20;
            let cellSizePx;
            let isScaleDefined = false;
            let minX, minY, maxX, maxY;
            let cols, rows;
            let currentWall = null;
            let isResizing = false;
            let resizeHandle = null;
            let isDrawing = false;
            let offsetX, offsetY;
            let mostSquareRect;
            let currentTool = 'wall';
            let findSecludedAreaButton;
            let secludedCells = [];
            let paths = []; // Stores paths from secluded cells to exits
            let showImage = true; // Flag to control image display
            let checkedCorners = []; // Array to store checked corner cells

            p.preload = function () {
                floorplanImg = p.loadImage(floorplanImage);
            };

            p.setup = function () {
                floorplanImg = p.loadImage(floorplanImage, () => {
                    let aspectRatio = floorplanImg.width / floorplanImg.height;

                    let containerWidth = sketchRef.current.clientWidth;
                    let containerHeight = sketchRef.current.clientHeight;
                    let canvasWidth = containerWidth;
                    let canvasHeight = canvasWidth / aspectRatio;

                    if (canvasHeight > containerHeight) {
                        canvasHeight = containerHeight;
                        canvasWidth = canvasHeight * aspectRatio;
                    }

                    p.createCanvas(canvasWidth, canvasHeight);

                    imgWidth = canvasWidth;
                    imgHeight = canvasHeight;

                    floorplanImg.resize(imgWidth, imgHeight);

                    traceBlackRectangles();
                    calculateExtremeEdges();
                    findMostSquareRectangle();

                    // Create the button after canvas is created
                    findSecludedAreaButton = p.createButton('Find Most Secluded Area');
                    findSecludedAreaButton.position(10, p.height + 10);
                    findSecludedAreaButton.mousePressed(findMostSecludedArea);
                });
            };

            p.windowResized = function () {
                let aspectRatio = floorplanImg.width / floorplanImg.height;

                let containerWidth = sketchRef.current.clientWidth;
                let containerHeight = sketchRef.current.clientHeight;
                let canvasWidth = containerWidth;
                let canvasHeight = canvasWidth / aspectRatio;

                if (canvasHeight > containerHeight) {
                    canvasHeight = containerHeight;
                    canvasWidth = canvasHeight * aspectRatio;
                }

                p.resizeCanvas(canvasWidth, canvasHeight);

                imgWidth = canvasWidth;
                imgHeight = canvasHeight;

                floorplanImg.resize(imgWidth, imgHeight);

                calculateExtremeEdges();
                if (isScaleDefined) {
                    defineGridFromExtremes();
                    processGridCells(); // Reprocess grid cells on resize
                }

                // Adjust button position
                if (findSecludedAreaButton) {
                    findSecludedAreaButton.position(10, p.height + 10);
                }
            };

            p.draw = function () {
                p.background(255);

                if (showImage) {
                    // Draw the floorplan image
                    p.image(floorplanImg, 0, 0, imgWidth, imgHeight);

                    // Draw traced black rectangles over the image
                    p.fill(0);
                    p.noStroke();
                    for (let rectData of rectangles) {
                        p.rect(rectData.x, rectData.y, rectData.w, rectData.h);
                    }

                    // Highlight the most square rectangle
                    if (mostSquareRect) {
                        p.fill(0, 255, 0, 100); // Highlight the rectangle in green
                        p.rect(
                            mostSquareRect.x,
                            mostSquareRect.y,
                            mostSquareRect.w,
                            mostSquareRect.h
                        );
                        p.fill(0);
                        p.textSize(16);
                        p.textAlign(p.LEFT, p.TOP);
                        p.text(
                            '<-- Click to define size',
                            mostSquareRect.x + mostSquareRect.w + 10,
                            mostSquareRect.y
                        );
                    }
                }

                if (isScaleDefined) {
                    drawGrid();
                    drawWalls();
                    drawSecludedCells();
                    drawPaths();
                    drawLegend();
                
                    // Highlight checked corner cells
                    p.fill(255, 0, 0, 100); // Red with transparency
                    p.noStroke();
                    for (let corner of checkedCorners) {
                        let x = minX + corner.x * cellSizePx;
                        let y = minY + corner.y * cellSizePx;
                        p.rect(x, y, cellSizePx, cellSizePx);
                    }
                }
                
            };

            p.mousePressed = function () {
                if (mostSquareRect && !isScaleDefined) {
                    if (
                        p.mouseX >= mostSquareRect.x &&
                        p.mouseX <= mostSquareRect.x + mostSquareRect.w &&
                        p.mouseY >= mostSquareRect.y &&
                        p.mouseY <= mostSquareRect.y + mostSquareRect.h
                    ) {
                        let realDistance = prompt(
                            'Enter the actual width of the highlighted square pillar in centimeters:'
                        );
                        if (realDistance) {
                            realDistance = parseFloat(realDistance);
                            if (!isNaN(realDistance) && realDistance > 0) {
                                let pixelDistance = mostSquareRect.w;
                                pixelsPerCm = pixelDistance / realDistance;
                                cellSizePx = cellSize * pixelsPerCm;
                                defineGridFromExtremes();
                                isScaleDefined = true;

                                // Process the grid cells after scale is defined
                                processGridCells();

                                // Remove the image after processing
                                showImage = false;
                            }
                        }
                    }
                } else if (isScaleDefined) {
                    let gridPos = getGridPosition(p.mouseX, p.mouseY);
                    if (gridPos) {
                        let wall = getWallAt(gridPos.col, gridPos.row);
                        if (wall) {
                            if (wall.type === 'autoWall') {
                                // Do not allow interaction with auto-detected walls
                                currentWall = null;
                            } else {
                                currentWall = wall;
                                isResizing = checkResizeHandle(p.mouseX, p.mouseY, currentWall);
                                if (!isResizing) {
                                    offsetX = gridPos.col - currentWall.x;
                                    offsetY = gridPos.row - currentWall.y;
                                }
                            }
                        } else {
                            isDrawing = true;
                            currentWall = {
                                x: gridPos.col,
                                y: gridPos.row,
                                w: 1,
                                h: 1,
                                type: currentTool,
                            };
                            walls.push(currentWall);
                        }
                    } else {
                        currentWall = null;
                    }
                }
            };

            p.mouseDragged = function () {
                if (isScaleDefined && currentWall) {
                    let gridPos = getGridPosition(p.mouseX, p.mouseY);
                    if (gridPos) {
                        if (isDrawing) {
                            currentWall.w = gridPos.col - currentWall.x + 1;
                            currentWall.h = gridPos.row - currentWall.y + 1;
                        } else if (isResizing) {
                            resizeWall(gridPos);
                        } else {
                            moveWall(gridPos);
                        }
                    }
                }
            };

            p.mouseReleased = function () {
                if (isDrawing) {
                    adjustWallPositionAndSize(currentWall);
                    isDrawing = false;
                    currentWall = null;
                } else if (isResizing) {
                    isResizing = false;
                    resizeHandle = null;
                }
            };

            p.keyPressed = function () {
                if (p.key === 'E' || p.key === 'e') {
                    currentTool = 'entrance';
                } else if (p.key === 'F' || p.key === 'f') {
                    currentTool = 'fireEscape';
                } else if (p.key === 'W' || p.key === 'w') {
                    currentTool = 'wall';
                } else if (p.keyCode === p.BACKSPACE || p.keyCode === p.DELETE) {
                    if (currentWall && currentWall.type !== 'autoWall') {
                        walls.splice(walls.indexOf(currentWall), 1);
                        currentWall = null;
                    }
                }
            };

            function traceBlackRectangles() {
                floorplanImg.loadPixels();
                let visited = new Array(floorplanImg.width)
                    .fill(null)
                    .map(() => new Array(floorplanImg.height).fill(false));

                for (let y = 0; y < floorplanImg.height; y++) {
                    for (let x = 0; x < floorplanImg.width; x++) {
                        if (!visited[x][y]) {
                            let color = floorplanImg.get(x, y);
                            if (color[0] === 0 && color[1] === 0 && color[2] === 0) {
                                let rectData = findRectangle(x, y, visited);
                                if (rectData) {
                                    rectangles.push(rectData);
                                }
                            }
                            visited[x][y] = true;
                        }
                    }
                }
            }

            function findRectangle(startX, startY, visited) {
                let width = 0,
                    height = 0;

                for (
                    let x = startX;
                    x < floorplanImg.width && !visited[x][startY];
                    x++
                ) {
                    let color = floorplanImg.get(x, startY);
                    if (color[0] === 0 && color[1] === 0 && color[2] === 0) width++;
                    else break;
                }

                for (
                    let y = startY;
                    y < floorplanImg.height && !visited[startX][y];
                    y++
                ) {
                    let color = floorplanImg.get(startX, y);
                    if (color[0] === 0 && color[1] === 0 && color[2] === 0) height++;
                    else break;
                }

                for (let y = startY; y < startY + height; y++) {
                    for (let x = startX; x < startX + width; x++) {
                        visited[x][y] = true;
                    }
                }

                return { x: startX, y: startY, w: width, h: height };
            }

            function findMostSquareRectangle() {
                let minAspectRatioDiff = Infinity;

                for (let rect of rectangles) {
                    let aspectRatioDiff = Math.abs(rect.w / rect.h - 1);
                    if (aspectRatioDiff < minAspectRatioDiff) {
                        minAspectRatioDiff = aspectRatioDiff;
                        mostSquareRect = rect;
                    }
                }
            }

            function calculateExtremeEdges() {
                minX = 0;
                minY = 0;
                maxX = imgWidth;
                maxY = imgHeight;
            }

            function getGridPosition(x, y) {
                let col = Math.floor((x - minX) / cellSizePx);
                let row = Math.floor((y - minY) / cellSizePx);
                if (col >= 0 && col < cols && row >= 0 && row < rows) {
                    return { col, row };
                }
                return null;
            }

            function defineGridFromExtremes() {
                cols = Math.floor((maxX - minX) / cellSizePx);
                rows = Math.floor((maxY - minY) / cellSizePx);
            }

            function drawGrid() {
                p.stroke(0, 0, 0, 10);
                for (let i = 0; i <= cols; i++) {
                    let x = minX + i * cellSizePx;
                    p.line(x, minY, x, maxY);
                }
                for (let j = 0; j <= rows; j++) {
                    let y = minY + j * cellSizePx;
                    p.line(minX, y, maxX, y);
                }
            }

            function drawWalls() {
                for (let wall of walls) {
                    let x = minX + wall.x * cellSizePx;
                    let y = minY + wall.y * cellSizePx;
                    let w = wall.w * cellSizePx;
                    let h = wall.h * cellSizePx;

                    switch (wall.type) {
                        case 'entrance':
                            p.fill(0, 255, 0); // Green for entrance
                            break;
                        case 'fireEscape':
                            p.fill(255, 0, 0); // Red for fire escape
                            break;
                        default:
                            p.fill(0); // Black for walls
                    }

                    p.noStroke();
                    p.rect(x, y, w, h);

                    if (wall === currentWall) {
                        p.stroke(0);
                        p.noFill();
                        p.rect(x, y, w, h);

                        drawHandles(x, y, w, h);
                    }
                }
            }

            function drawHandles(x, y, w, h) {
                p.noFill();
                p.stroke(220);
                let handleSize = 6;

                p.rect(x, y, handleSize, handleSize);
                p.rect(x + w - handleSize, y, handleSize, handleSize);
                p.rect(x, y + h - handleSize, handleSize, handleSize);
                p.rect(x + w - handleSize, y + h - handleSize, handleSize, handleSize);
            }

            function checkResizeHandle(mouseX, mouseY, wall) {
                let wallX = minX + wall.x * cellSizePx;
                let wallY = minY + wall.y * cellSizePx;
                let wallW = wall.w * cellSizePx;
                let wallH = wall.h * cellSizePx;
                let handleSize = 8;

                if (
                    mouseX >= wallX &&
                    mouseX <= wallX + handleSize &&
                    mouseY >= wallY &&
                    mouseY <= wallY + handleSize
                ) {
                    resizeHandle = 'nw';
                    return true;
                }
                if (
                    mouseX >= wallX + wallW - handleSize &&
                    mouseX <= wallX + wallW &&
                    mouseY >= wallY &&
                    mouseY <= wallY + handleSize
                ) {
                    resizeHandle = 'ne';
                    return true;
                }
                if (
                    mouseX >= wallX &&
                    mouseX <= wallX + handleSize &&
                    mouseY >= wallY + wallH - handleSize &&
                    mouseY <= wallY + wallH
                ) {
                    resizeHandle = 'sw';
                    return true;
                }
                if (
                    mouseX >= wallX + wallW - handleSize &&
                    mouseX <= wallX + wallW &&
                    mouseY >= wallY + wallH - handleSize &&
                    mouseY <= wallY + wallH
                ) {
                    resizeHandle = 'se';
                    return true;
                }

                resizeHandle = null;
                return false;
            }

            function drawLegend() {
                p.fill(0);
                p.textSize(12);
                p.textAlign(p.RIGHT);
                p.text(
                    `Grid cell: ${cellSize} cm x ${cellSize} cm`,
                    p.width - 10,
                    p.height - 55
                );
                p.text(`Current tool: ${currentTool}`, p.width - 10, p.height - 40);
                p.text(
                    'Press W: Wall, E: Entrance, F: Fire Escape',
                    p.width - 10,
                    p.height - 25
                );
                p.text('Click the button below to find paths.', p.width - 10, p.height - 10);
            }

            function moveWall(gridPos) {
                if (gridPos) {
                    let newX = gridPos.col - offsetX;
                    let newY = gridPos.row - offsetY;

                    newX = p.constrain(newX, 0, cols - currentWall.w);
                    newY = p.constrain(newY, 0, rows - currentWall.h);

                    currentWall.x = newX;
                    currentWall.y = newY;
                }
            }

            function resizeWall(gridPos) {
                if (gridPos && resizeHandle) {
                    let newX = currentWall.x;
                    let newY = currentWall.y;
                    let newW = currentWall.w;
                    let newH = currentWall.h;

                    switch (resizeHandle) {
                        case 'nw':
                            newW += currentWall.x - gridPos.col;
                            newH += currentWall.y - gridPos.row;
                            newX = gridPos.col;
                            newY = gridPos.row;
                            break;
                        case 'ne':
                            newW = gridPos.col - currentWall.x + 1;
                            newH += currentWall.y - gridPos.row;
                            newY = gridPos.row;
                            break;
                        case 'sw':
                            newW += currentWall.x - gridPos.col;
                            newX = gridPos.col;
                            newH = gridPos.row - currentWall.y + 1;
                            break;
                        case 'se':
                            newW = gridPos.col - currentWall.x + 1;
                            newH = gridPos.row - currentWall.y + 1;
                            break;
                        default:
                            break;
                    }

                    newW = Math.max(newW, 1);
                    newH = Math.max(newH, 1);

                    newX = p.constrain(newX, 0, cols - newW);
                    newY = p.constrain(newY, 0, rows - newH);

                    currentWall.x = newX;
                    currentWall.y = newY;
                    currentWall.w = newW;
                    currentWall.h = newH;
                }
            }

            function adjustWallPositionAndSize(wall) {
                if (wall.w < 0) {
                    wall.x += wall.w;
                    wall.w = Math.abs(wall.w);
                }
                if (wall.h < 0) {
                    wall.y += wall.h;
                    wall.h = Math.abs(wall.h);
                }

                wall.x = p.constrain(wall.x, 0, cols - wall.w);
                wall.y = p.constrain(wall.y, 0, rows - wall.h);
            }

            function getWallAt(col, row) {
                for (let wall of walls) {
                    if (
                        col >= wall.x &&
                        col < wall.x + wall.w &&
                        row >= wall.y &&
                        row < wall.y + wall.h
                    ) {
                        return wall;
                    }
                }
                return null;
            }

            // New function to process grid cells after scale is defined
            function processGridCells() {
                floorplanImg.loadPixels();

                // Clear previous auto-detected walls
                walls = walls.filter((wall) => wall.type !== 'autoWall');

                for (let col = 0; col < cols; col++) {
                    for (let row = 0; row < rows; row++) {
                        let xStart = Math.floor(minX + col * cellSizePx);
                        let yStart = Math.floor(minY + row * cellSizePx);
                        let xEnd = Math.min(
                            xStart + Math.floor(cellSizePx),
                            floorplanImg.width
                        );
                        let yEnd = Math.min(
                            yStart + Math.floor(cellSizePx),
                            floorplanImg.height
                        );

                        let blackPixels = 0;
                        let totalPixels = (xEnd - xStart) * (yEnd - yStart);

                        for (let x = xStart; x < xEnd; x++) {
                            for (let y = yStart; y < yEnd; y++) {
                                let index = 4 * (x + y * floorplanImg.width);
                                let r = floorplanImg.pixels[index];
                                let g = floorplanImg.pixels[index + 1];
                                let b = floorplanImg.pixels[index + 2];

                                if (r <= 50 && g <= 50 && b <= 50) {
                                    blackPixels++;
                                }
                            }
                        }

                        let blackPercentage = (blackPixels / totalPixels) * 100;

                        if (blackPercentage >= 27) {
                            // Add this cell as a wall
                            walls.push({
                                x: col,
                                y: row,
                                w: 1,
                                h: 1,
                                type: 'autoWall', // Indicate it's an auto-detected wall
                            });
                        }
                    }
                }
            }

            // Implementing Theta* algorithm with optimizations
            function isCornerCell(grid, col, row) {
                if (grid[col][row].isWall) return false;
            
                let walls = 0;
                let openSpaces = 0;
                let adjacentPositions = [
                    { x: col - 1, y: row },
                    { x: col + 1, y: row },
                    { x: col, y: row - 1 },
                    { x: col, y: row + 1 },
                ];
            
                for (let pos of adjacentPositions) {
                    if (pos.x < 0 || pos.x >= cols || pos.y < 0 || pos.y >= rows) {
                        walls++;
                    } else if (grid[pos.x][pos.y].isWall) {
                        walls++;
                    } else {
                        openSpaces++;
                    }
                }
            
                // A corner cell will have exactly two walls and two open spaces adjacent to it
                return walls === 2 && openSpaces === 2;
            }
            function heuristicToClosestExit(x, y, exits) {
                let minDistance = Infinity;
                for (let exit of exits) {
                    let distance = heuristic(x, y, exit.x, exit.y);
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                }
                return minDistance;
            }
            
            function findMostSecludedArea() {
                if (!isScaleDefined) {
                    alert('Please define the scale first.');
                    return;
                }
            
                // Reset paths and secluded cells
                paths = [];
                secludedCells = [];
                checkedCorners = []; // Reset the checkedCorners array
            
                // Prepare the grid with walls and accessible cells
                let grid = [];
                for (let i = 0; i < cols; i++) {
                    grid[i] = [];
                    for (let j = 0; j < rows; j++) {
                        grid[i][j] = {
                            isWall: false,
                            isExit: false,
                            g: Infinity,
                            f: Infinity,
                            parent: null,
                            closed: false,
                            x: i,
                            y: j,
                        };
                    }
                }
            
                // Mark walls and exits
                let exits = [];
            
                for (let wall of walls) {
                    if (wall.type === 'wall' || wall.type === 'autoWall') {
                        for (let i = wall.x; i < wall.x + wall.w; i++) {
                            for (let j = wall.y; j < wall.y + wall.h; j++) {
                                grid[i][j].isWall = true;
                            }
                        }
                    } else if (wall.type === 'fireEscape' || wall.type === 'entrance') {
                        for (let i = wall.x; i < wall.x + wall.w; i++) {
                            for (let j = wall.y; j < wall.y + wall.h; j++) {
                                grid[i][j].isExit = true;
                                exits.push({ x: i, y: j });
                            }
                        }
                    }
                }
            
                // Identify corner cells
                let startingCells = findCornerCells(grid);
            
                if (startingCells.length === 0) {
                    alert('No suitable corner cells found.');
                    return;
                }
            
                let maxDistance = -1;
            
                // Run Theta* from each corner cell
                for (let startCell of startingCells) {
                    // Reset grid nodes
                    for (let x = 0; x < cols; x++) {
                        for (let y = 0; y < rows; y++) {
                            grid[x][y].g = Infinity;
                            grid[x][y].f = Infinity;
                            grid[x][y].parent = null;
                            grid[x][y].closed = false;
                        }
                    }
            
                    let openSet = new MinHeap();
            
                    let i = startCell.x;
                    let j = startCell.y;
            
                    grid[i][j].g = 0;
                    grid[i][j].f = heuristicToClosestExit(i, j, exits);
                    openSet.insert({ x: i, y: j, f: grid[i][j].f });
            
                    let foundPath = false;
                    let bestExit = null;
                    let bestG = Infinity;
            
                    while (!openSet.isEmpty()) {
                        const current = openSet.extractMin();
                        const x = current.x;
                        const y = current.y;
            
                        if (grid[x][y].closed) continue;
                        grid[x][y].closed = true;
            
                        if (grid[x][y].isExit) {
                            foundPath = true;
                            if (grid[x][y].g < bestG) {
                                bestG = grid[x][y].g;
                                bestExit = { x: x, y: y };
                            }
                            continue; // Continue to explore other paths
                        }
            
                        const neighbors = getNeighbors(grid, x, y);
                        for (let neighbor of neighbors) {
                            if (grid[neighbor.x][neighbor.y].closed) continue;
            
                            let gNew = grid[x][y].g + euclideanDistance(x, y, neighbor.x, neighbor.y);
                            let parent = grid[x][y].parent;
            
                            if (parent && lineOfSight(grid, parent.x, parent.y, neighbor.x, neighbor.y)) {
                                let gPotential = grid[parent.x][parent.y].g + euclideanDistance(parent.x, parent.y, neighbor.x, neighbor.y);
                                if (gPotential < grid[neighbor.x][neighbor.y].g) {
                                    grid[neighbor.x][neighbor.y].g = gPotential;
                                    grid[neighbor.x][neighbor.y].parent = grid[parent.x][parent.y];
                                    grid[neighbor.x][neighbor.y].f = gPotential + heuristicToClosestExit(neighbor.x, neighbor.y, exits);
                                    openSet.insert({ x: neighbor.x, y: neighbor.y, f: grid[neighbor.x][neighbor.y].f });
                                }
                            } else {
                                if (gNew < grid[neighbor.x][neighbor.y].g) {
                                    grid[neighbor.x][neighbor.y].g = gNew;
                                    grid[neighbor.x][neighbor.y].parent = grid[x][y];
                                    grid[neighbor.x][neighbor.y].f = gNew + heuristicToClosestExit(neighbor.x, neighbor.y, exits);
                                    openSet.insert({ x: neighbor.x, y: neighbor.y, f: grid[neighbor.x][neighbor.y].f });
                                }
                            }
                        }
                    }
            
                    if (foundPath && bestG > maxDistance) {
                        maxDistance = bestG;
                        secludedCells = [startCell];
                        paths = [reconstructPath(grid, i, j, bestExit.x, bestExit.y)];
                    } else if (foundPath && bestG === maxDistance) {
                        secludedCells.push(startCell);
                        paths.push(reconstructPath(grid, i, j, bestExit.x, bestExit.y));
                    }
                }
            
                if (maxDistance === -1) {
                    alert('No path found to exits from corner cells.');
                } else {
                    alert(
                        `The furthest corner from an exit is approximately ${Math.round(maxDistance * cellSize)/100} m away.`
                    );
                }
            
                p.redraw();
            }
            

            function findCornerCells(grid) {
                let startingCells = [];
                checkedCorners = []; // Clear previous checked corners
            
                for (let col = 0; col < cols; col++) {
                    for (let row = 0; row < rows; row++) {
                        if (isCornerCell(grid, col, row)) {
                            startingCells.push({ x: col, y: row });
                            checkedCorners.push({ x: col, y: row }); // For highlighting
                        }
                    }
                }
                return startingCells;
            }
            


            function lineOfSight(grid, x0, y0, x1, y1) {
                let sx, sy, dx, dy, err, e2;
                dx = Math.abs(x1 - x0);
                dy = Math.abs(y1 - y0);
                sx = x0 < x1 ? 1 : -1;
                sy = y0 < y1 ? 1 : -1;
                err = dx - dy;

                while (true) {
                    if (grid[x0][y0].isWall) {
                        return false;
                    }
                    if (x0 === x1 && y0 === y1) {
                        break;
                    }
                    e2 = 2 * err;
                    if (e2 > -dy) {
                        err -= dy;
                        x0 += sx;
                    }
                    if (e2 < dx) {
                        err += dx;
                        y0 += sy;
                    }
                }
                return true;
            }

            function heuristic(x1, y1, x2, y2) {
                return Math.hypot(x2 - x1, y2 - y1);
            }

            function euclideanDistance(x1, y1, x2, y2) {
                return Math.hypot(x2 - x1, y2 - y1);
            }

            function getNeighbors(grid, x, y) {
                let neighbors = [];
                let directions = [
                    { x: 0, y: -1 },
                    { x: 1, y: -1 },
                    { x: 1, y: 0 },
                    { x: 1, y: 1 },
                    { x: 0, y: 1 },
                    { x: -1, y: 1 },
                    { x: -1, y: 0 },
                    { x: -1, y: -1 },
                ];

                for (let dir of directions) {
                    let nx = x + dir.x;
                    let ny = y + dir.y;
                    if (
                        nx >= 0 &&
                        nx < cols &&
                        ny >= 0 &&
                        ny < rows &&
                        !grid[nx][ny].isWall
                    ) {
                        neighbors.push({ x: nx, y: ny });
                    }
                }
                return neighbors;
            }

            function reconstructPath(grid, startX, startY, endX, endY) {
                let path = [];
                let current = grid[endX][endY];
                while (current && !(current.x === startX && current.y === startY)) {
                    path.push({ x: current.x, y: current.y });
                    current = current.parent;
                }
                path.push({ x: startX, y: startY });
                return path.reverse();
            }

            function drawSecludedCells() {
                if (secludedCells.length > 0) {
                    p.fill(0, 0, 255, 100); // Blue with transparency
                    p.noStroke();
                    for (let cell of secludedCells) {
                        let x = minX + cell.x * cellSizePx;
                        let y = minY + cell.y * cellSizePx;
                        p.rect(x, y, cellSizePx, cellSizePx);
                    }
                }
            }

            function drawPaths() {
                if (paths.length > 0) {
                    p.stroke(255, 165, 0); // Orange color for path
                    p.strokeWeight(4);
                    for (let path of paths) {
                        p.noFill();
                        p.beginShape();
                        for (let cell of path) {
                            let x = minX + cell.x * cellSizePx + cellSizePx / 2;
                            let y = minY + cell.y * cellSizePx + cellSizePx / 2;
                            p.vertex(x, y);
                        }
                        p.endShape();
                    }
                    p.strokeWeight(1); // Reset stroke weight
                }
            }

            class MinHeap {
                constructor() {
                    this.heap = [];
                }

                insert(node) {
                    this.heap.push(node);
                    this.bubbleUp(this.heap.length - 1);
                }

                extractMin() {
                    const min = this.heap[0];
                    const end = this.heap.pop();
                    if (this.heap.length > 0) {
                        this.heap[0] = end;
                        this.sinkDown(0);
                    }
                    return min;
                }

                bubbleUp(n) {
                    const element = this.heap[n];
                    while (n > 0) {
                        const parentN = Math.floor((n - 1) / 2);
                        const parent = this.heap[parentN];
                        if (element.f >= parent.f) break;
                        this.heap[parentN] = element;
                        this.heap[n] = parent;
                        n = parentN;
                    }
                }

                sinkDown(n) {
                    const length = this.heap.length;
                    const element = this.heap[n];

                    while (true) {
                        let swap = null;
                        const child1N = 2 * n + 1;
                        const child2N = 2 * n + 2;

                        if (child1N < length) {
                            const child1 = this.heap[child1N];
                            if (child1.f < element.f) {
                                swap = child1N;
                            }
                        }
                        if (child2N < length) {
                            const child2 = this.heap[child2N];
                            if (
                                (swap === null && child2.f < element.f) ||
                                (swap !== null && child2.f < this.heap[swap].f)
                            ) {
                                swap = child2N;
                            }
                        }
                        if (swap === null) break;
                        this.heap[n] = this.heap[swap];
                        this.heap[swap] = element;
                        n = swap;
                    }
                }

                isEmpty() {
                    return this.heap.length === 0;
                }
            }
        };

        p5InstanceRef.current = new p5(sketch, sketchRef.current);

        return () => {
            if (p5InstanceRef.current) {
                p5InstanceRef.current.remove();
                p5InstanceRef.current = null;
            }
        };
    }, [floorplanImage]);

    return (
        <div
            ref={sketchRef}
            className="w-full h-full border-2 border-gray-300"
            style={{ height: '500px', position: 'relative' }}
        ></div>
    );
}

export default Canvas; 