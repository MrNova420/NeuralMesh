import React, { useEffect, useRef, useState } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchSpeed?: number;
  glitchIntensity?: number;
}

const GlitchText: React.FC<GlitchTextProps> = ({ 
  text, 
  className = '', 
  glitchSpeed = 3000,
  glitchIntensity = 0.1 
}) => {
  const [displayText, setDisplayText] = useState(text);
  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    setDisplayText(text);

    const glitch = () => {
      if (Math.random() < glitchIntensity) {
        const chars = text.split('');
        const glitchPositions = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < glitchPositions; i++) {
          const pos = Math.floor(Math.random() * chars.length);
          chars[pos] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        
        setDisplayText(chars.join(''));
        
        setTimeout(() => setDisplayText(text), 50 + Math.random() * 100);
      }
    };

    intervalRef.current = setInterval(glitch, glitchSpeed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, glitchSpeed, glitchIntensity]);

  return (
    <span 
      className={`font-mono relative inline-block ${className}`}
      style={{
        textShadow: displayText !== text 
          ? '0 0 5px rgba(255, 0, 0, 0.5), 0 0 10px rgba(0, 255, 0, 0.5), 0 0 15px rgba(0, 0, 255, 0.5)'
          : 'none',
        transition: 'text-shadow 0.05s ease'
      }}
    >
      {displayText}
    </span>
  );
};

export default GlitchText;
