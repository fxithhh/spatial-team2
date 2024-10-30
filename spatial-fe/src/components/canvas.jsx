import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

function Canvas({ floorplanImage }) {
    const sketchRef = useRef();
    const p5InstanceRef = useRef(null); // Use a ref instead of state

    useEffect(() => {
        if (!floorplanImage) {
            // If there's no floorplan image, clear the canvas and remove the p5 instance
            if (p5InstanceRef.current) {
                p5InstanceRef.current.remove();
                p5InstanceRef.current = null;
            }
            return;
        }

        // Clean up any existing p5 instance before creating a new one
        if (p5InstanceRef.current) {
            p5InstanceRef.current.remove();
            p5InstanceRef.current = null;
        }

        const sketch = (p) => {
            // Declare variables inside the sketch function
            let floorplanImg;
            let imgWidth, imgHeight;
            let rectangles = []; // Detected black rectangles from the floorplan
            let walls = []; // User-drawn movable walls
            let pixelsPerCm; // Pixels per centimeter
            let cellSize = 20; // Default cell size in cm
            let cellSizePx; // Cell size in pixels
            let isScaleDefined = false;
            let minX, minY, maxX, maxY; // Boundaries for the grid
            let cols, rows; // Number of columns and rows in the grid
            let currentWall = null; // Currently selected wall
            let isResizing = false;
            let resizeHandle = null;
            let isDrawing = false; // Flag for drawing new wall
            let offsetX, offsetY; // For moving walls
            let mostSquareRect;

            p.preload = function () {
                floorplanImg = p.loadImage(floorplanImage);
            };

            p.setup = function () {
                p.createCanvas(
                    sketchRef.current.clientWidth,
                    sketchRef.current.clientHeight
                );

                // Resize the image while keeping the aspect ratio
                let aspectRatio = floorplanImg.width / floorplanImg.height;
                if (p.width / p.height > aspectRatio) {
                    imgHeight = p.height * 0.9; // Leave some margin
                    imgWidth = imgHeight * aspectRatio;
                } else {
                    imgWidth = p.width * 0.9;
                    imgHeight = imgWidth / aspectRatio;
                }

                floorplanImg.resize(imgWidth, imgHeight);

                traceBlackRectangles();
                calculateExtremeEdges();
                findMostSquareRectangle();
            };

            p.windowResized = function () {
                p.resizeCanvas(
                    sketchRef.current.clientWidth,
                    sketchRef.current.clientHeight
                );
            };

            p.draw = function () {
                p.background(255);

                // Draw the floorplan image
                p.image(floorplanImg, 0, 0, imgWidth, imgHeight);

                // Draw traced black rectangles over the image
                p.fill(0);
                p.noStroke();
                for (let rectData of rectangles) {
                    p.rect(rectData.x, rectData.y, rectData.w, rectData.h);
                }

                // Highlight the most square rectangle
                if (mostSquareRect && !isScaleDefined) {
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

                // Draw the grid after defining scale
                if (isScaleDefined) {
                    drawGrid();
                    drawWalls();
                    drawLegend();
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
                                let pixelDistance = mostSquareRect.w; // Use the width of the highlighted rectangle
                                pixelsPerCm = pixelDistance / realDistance; // Calculate pixels per cm
                                cellSizePx = cellSize * pixelsPerCm; // Calculate cell size in pixels
                                defineGridFromExtremes(); // Create grid from the extreme edges
                                isScaleDefined = true;
                            }
                        }
                    }
                } else if (isScaleDefined) {
                    let gridPos = getGridPosition(p.mouseX, p.mouseY);
                    if (gridPos) {
                        let wall = getWallAt(gridPos.col, gridPos.row);
                        if (wall) {
                            // Clicked on existing wall
                            currentWall = wall;
                            isResizing = checkResizeHandle(p.mouseX, p.mouseY, currentWall);
                            if (!isResizing) {
                                // Prepare for moving
                                offsetX = gridPos.col - currentWall.x;
                                offsetY = gridPos.row - currentWall.y;
                            }
                        } else {
                            // Not clicked on a wall, start drawing a new wall
                            isDrawing = true;
                            currentWall = {
                                x: gridPos.col,
                                y: gridPos.row,
                                w: 1,
                                h: 1,
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
                            // Update the size of the new wall
                            currentWall.w = gridPos.col - currentWall.x + 1;
                            currentWall.h = gridPos.row - currentWall.y + 1;
                        } else if (isResizing) {
                            // Resizing the wall
                            resizeWall(gridPos);
                        } else {
                            // Moving the wall
                            moveWall(gridPos);
                        }
                    }
                }
            };

            p.mouseReleased = function () {
                if (isDrawing) {
                    // Finish drawing
                    adjustWallPositionAndSize(currentWall);
                    isDrawing = false;
                    currentWall = null;
                } else if (isResizing) {
                    isResizing = false;
                    resizeHandle = null;
                }
            };

            p.keyPressed = function () {
                if (p.keyCode === p.BACKSPACE || p.keyCode === p.DELETE) {
                    if (currentWall) {
                        walls.splice(walls.indexOf(currentWall), 1);
                        currentWall = null;
                    }
                }
            };

            // Helper functions

            // Trace black rectangles from the image
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
                                // Detect black pixel
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

            // Helper to create a rectangle from a black pixel area
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

            // Find the most square rectangle and highlight it
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

            // Set the extreme edges to the image dimensions
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
                p.stroke(0, 0, 0, 50); // Thin black lines
                // Draw vertical lines
                for (let i = 0; i <= cols; i++) {
                    let x = minX + i * cellSizePx;
                    p.line(x, minY, x, maxY);
                }
                // Draw horizontal lines
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

                    p.fill(150);
                    p.noStroke();
                    p.rect(x, y, w, h);

                    // If the wall is selected, draw handles
                    if (wall === currentWall) {
                        p.stroke(0, 0, 255);
                        p.noFill();
                        p.rect(x, y, w, h);

                        drawHandles(x, y, w, h);
                    }
                }
            }

            function drawHandles(x, y, w, h) {
                p.fill(0, 0, 255);
                p.noStroke();
                let handleSize = 8;

                // Corners
                p.ellipse(x, y, handleSize);
                p.ellipse(x + w, y, handleSize);
                p.ellipse(x, y + h, handleSize);
                p.ellipse(x + w, y + h, handleSize);
            }

            function drawLegend() {
                p.fill(0);
                p.textSize(12);
                p.textAlign(p.RIGHT);
                p.text(
                    `Grid cell: ${cellSize} cm x ${cellSize} cm`,
                    p.width - 10,
                    p.height - 10
                );
            }

            function moveWall(gridPos) {
                if (gridPos) {
                    let newX = gridPos.col - offsetX;
                    let newY = gridPos.row - offsetY;

                    // Ensure the wall stays within grid boundaries
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

                    // Adjust position and size based on the handle
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

                    // Ensure minimum size of 1x1
                    newW = Math.max(newW, 1);
                    newH = Math.max(newH, 1);

                    // Ensure the wall stays within grid boundaries
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

                // Ensure the wall stays within grid boundaries
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

            function checkResizeHandle(x, y, wall) {
                let wallX = minX + wall.x * cellSizePx;
                let wallY = minY + wall.y * cellSizePx;
                let wallW = wall.w * cellSizePx;
                let wallH = wall.h * cellSizePx;
                let handleSize = 8;

                // Check corners
                if (p.dist(x, y, wallX, wallY) < handleSize) {
                    resizeHandle = 'nw';
                    return true;
                }
                if (p.dist(x, y, wallX + wallW, wallY) < handleSize) {
                    resizeHandle = 'ne';
                    return true;
                }
                if (p.dist(x, y, wallX, wallY + wallH) < handleSize) {
                    resizeHandle = 'sw';
                    return true;
                }
                if (p.dist(x, y, wallX + wallW, wallY + wallH) < handleSize) {
                    resizeHandle = 'se';
                    return true;
                }

                // Not on a resize handle
                resizeHandle = null;
                return false;
            }
        };

        p5InstanceRef.current = new p5(sketch, sketchRef.current);

        return () => {
            if (p5InstanceRef.current) {
                p5InstanceRef.current.remove();
                p5InstanceRef.current = null;
            }
        };
    }, [floorplanImage]); // Only depend on floorplanImage

    return (
        <div
            ref={sketchRef}
            className="w-full h-full border-2 border-gray-300"
            style={{ height: '500px' }} // Adjust height as needed
        ></div>
    );
}

export default Canvas;
