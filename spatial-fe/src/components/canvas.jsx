import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

function Canvas({ shapes }) {
    const sketchRef = useRef();

    useEffect(() => {
        const sketch = (p) => {
            let isDragging = false;
            let currentShape = null; // Track the shape being dragged

            p.setup = function () {
                p.createCanvas(sketchRef.current.clientWidth, 400);
            };

            p.draw = function () {
                p.background(255);
                p.fill(0);

                // Draw all shapes in the shapes array
                shapes.forEach((shape) => {
                    p.ellipse(shape.x, shape.y, shape.radius * 2, shape.radius * 2);
                });
            };

            p.mousePressed = function () {
                shapes.forEach((shape) => {
                    if (p.dist(p.mouseX, p.mouseY, shape.x, shape.y) < shape.radius) {
                        isDragging = true;
                        currentShape = shape; // Set the current shape to the one being dragged
                    }
                });
            };

            p.mouseReleased = function () {
                isDragging = false;
                currentShape = null; // Clear the current shape
            };

            p.mouseDragged = function () {
                if (isDragging && currentShape) {
                    currentShape.x = p.mouseX;
                    currentShape.y = p.mouseY;
                }
            };

            p.windowResized = function () {
                p.resizeCanvas(sketchRef.current.clientWidth, 400);
            };
        };

        const myP5 = new p5(sketch, sketchRef.current);

        return () => {
            myP5.remove();
        };
    }, [shapes]); // Re-run effect when shapes change

    return <div ref={sketchRef} className='w-full h-full border-2 border-gray-300'></div>;
}

export default Canvas;
