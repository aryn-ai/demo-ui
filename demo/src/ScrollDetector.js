import React, { useContext, useRef } from 'react';
import { SettingContext } from './App';

const ScrollVelocityDetection = (props) => { 
    const {reset} = props;
    const {settings, setSettings} = useContext(SettingContext);
  let lastScrollTime = 0;
  let lastScrollY = 0;
  let consecutiveUpScrolls = 0;

  const handleScroll = (event) => {
    const currentTime = Date.now();
    const currentScrollY = event.pageY || event.clientY;

    if (lastScrollTime && lastScrollY) {
      const timeElapsed = currentTime - lastScrollTime;
      const directionScrolled = currentScrollY - lastScrollY;
      const direction = directionScrolled > 0 ? 'down' : 'up';
      const distanceScrolled = Math.abs(directionScrolled);
      // Calculate the velocity (pixels per millisecond)
      const velocity = distanceScrolled / timeElapsed;
        //value 1-10 that represent the difficult to scroll up
        const difficulty = settings.difficulty;
      // Check if the velocity is above a certain threshold (adjust as needed)
      
      const velocityThreshold = difficulty * .05; // Adjust this value as needed
      if (velocity > velocityThreshold) {
        // The wheel is scrolled with a decent velocity
        // Add your logic here for what should happen when scrolled with decent velocity
        //console.log(`Scrolling ${direction} with decent velocity`);
        if (consecutiveUpScrolls > difficulty && direction === 'down') {
            console.log(`Down scroll after more than ${difficulty} consecutive up scrolls!`);
            reset();
            // Add your logic here for what should happen in this scenario
          }
        if (direction === 'up') {
          // Increment the consecutiveUpScrolls count if it's an 'up' scroll
          consecutiveUpScrolls++;
        } else {
          // Reset the consecutiveUpScrolls count if it's a 'down' scroll
          consecutiveUpScrolls = 0;
        }

        // Check if more than 10 consecutive 'up' scrolls occurred
        
      }
    }

    lastScrollTime = currentTime;
    lastScrollY = currentScrollY;
  };
  //window.addEventListener('wheel', handleScroll);

  return (
    <div onWheel={handleScroll} className = "chat-responses">
      {props.children}
    </div>
  );
};

export default ScrollVelocityDetection;
