import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type DonutChartProps = {
  value: number;
  total: number;
  size?: number;
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
};

export default function DonutChart({
  value,
  total,
  size = 120,
  thickness = 6,
  color = '#4e8df5',
  backgroundColor = '#e6e6e6',
  children,
}: DonutChartProps) {
  const safeTotal = total <= 0 ? 1 : total;
  const clamped = Math.max(0, Math.min(value, safeTotal));
  const progress = safeTotal === 0 ? 0 : clamped / safeTotal;

  const radius = size / 2;
  const r = radius - thickness / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);
  const centerWidth = size - thickness * 2 - 8;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={styles.svg}
      >
        <Circle cx={radius} cy={radius} r={r} stroke={backgroundColor} strokeWidth={thickness} fill="none" />
        <Circle
          cx={radius}
          cy={radius}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {children ? (
        <View style={[styles.center, { width: Math.max(0, centerWidth) }]}> 
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});