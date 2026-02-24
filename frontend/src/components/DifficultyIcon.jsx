// In src/components/DifficultyIcon.jsx
import React from 'react';

// This component will take a 'level' (1-5) and a 'color'
export default function DifficultyIcon({ level = 1, color = 'text-gray-400' }) {
  const bars = [1, 2, 3, 4, 5];

  return (
    <svg 
      width="48" 
      height="48" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`mx-auto mb-2 ${color}`}
    >
      {bars.map(bar => (
        <rect
          key={bar}
          x={3 + (bar - 1) * 4} // Position each bar
          y={20 - (bar * 3)}      // Set height from the bottom
          width="3"
          height={bar * 3}
          rx="1.5"                 // Rounded top
          className={bar <= level ? 'opacity-100' : 'opacity-20'} // Fill based on level
          fill="currentColor"
        />
      ))}
    </svg>
  );
}