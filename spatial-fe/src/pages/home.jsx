import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

const Home = () => {
  const sketchRef = useRef();

  useEffect(() => {
    const sketch = (p) => {
      p.setup = () => {
        p.createCanvas(400, 400);
      };

      p.draw = () => {
        p.background(0);
        p.ellipse(p.width / 2, p.height / 2, 100, 100);
      };
    };

    const myP5 = new p5(sketch, sketchRef.current);

    return () => {
      myP5.remove();
    };
  }, []);

  return <div ref={sketchRef}></div>;
};

export default Home;
