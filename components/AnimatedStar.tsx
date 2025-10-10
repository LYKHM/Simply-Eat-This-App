import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle, 
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface AnimatedStarProps {
  size?: number;
  color?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
}

const AnimatedStar: React.FC<AnimatedStarProps> = ({
  size = 12,
  color = '#6cc24a',
  delay = 0,
  duration = 2000,
  x = 0,
  y = 0,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Scale animation
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: duration / 2 }),
        -1,
        true
      )
    );

    // Opacity animation
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: duration / 3 }),
        -1,
        true
      )
    );

    // Rotation animation
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: duration }),
        -1,
        false
      )
    );
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(scale.value, [0, 1], [0.3, 1.2]) },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: interpolate(opacity.value, [0, 1], [0.2, 1]),
    };
  });

  // Star SVG path (✦ shape)
  const starPath = "M12 2l2.4 7.2h7.6l-6.2 4.8 2.4 7.2L12 18l-6.2 3.2 2.4-7.2-6.2-4.8h7.6L12 2z";

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d={starPath}
          fill={color}
          stroke={color}
          strokeWidth="0.5"
          opacity={0.9}
        />
      </Svg>
    </Animated.View>
  );
};

export default AnimatedStar;
