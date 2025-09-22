import React, { useMemo } from 'react';
import { View } from 'react-native';
import AnimatedStar from './AnimatedStar';

interface SparkleContainerProps {
  size?: number;
  color?: string;
  starCount?: number;
  radius?: number;
}

const SparkleContainer: React.FC<SparkleContainerProps> = ({
  size = 8,
  color = '#6cc24a',
  starCount = 6,
  radius = 25,
}) => {
  // Memoize star positions so they don't regenerate on every render
  const starPositions = useMemo(() => {
    const positions = [];
    const centerX = radius;
    const centerY = radius;
    
    for (let i = 0; i < starCount; i++) {
      const angle = (i * 2 * Math.PI) / starCount;
      // Add some randomness to make it more organic
      const randomRadius = radius + (Math.random() - 0.5) * 8;
      const x = centerX + Math.cos(angle) * randomRadius - size / 2;
      const y = centerY + Math.sin(angle) * randomRadius - size / 2;
      
      positions.push({
        x,
        y,
        delay: i * 200 + Math.random() * 300, // More varied delays
        size: size + Math.random() * 4, // Slight size variation
        duration: 2500 + Math.random() * 1000, // Move duration here too
      });
    }
    
    return positions;
  }, [size, color, starCount, radius]); // Only recalculate if these change

  return (
    <View
      style={{
        position: 'absolute',
        width: radius * 2,
        height: radius * 2,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {starPositions.map((star, index) => (
        <AnimatedStar
          key={index}
          x={star.x}
          y={star.y}
          size={star.size}
          color={color}
          delay={star.delay}
          duration={star.duration}
        />
      ))}
    </View>
  );
};

export default SparkleContainer;