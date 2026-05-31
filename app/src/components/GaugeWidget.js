import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const SIZE   = 200;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * RADIUS;

function getColor(pct) {
  if (pct > 50) return ['#22c55e', '#16a34a']; // verde
  if (pct > 20) return ['#f59e0b', '#d97706']; // amarelo
  return ['#ef4444', '#dc2626'];                // vermelho
}

/**
 * Gauge circular mostrando percentual restante.
 * Props: percentage (0-100), label (string), sublabel (string)
 */
export default function GaugeWidget({ percentage = 0, label = '', sublabel = '' }) {
  const pct     = Math.max(0, Math.min(100, percentage));
  const offset  = CIRCUM * (1 - pct / 100);
  const [c1, c2] = getColor(pct);

  return (
    <View style={styles.container} testID="gauge-widget">
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c1} />
            <Stop offset="1" stopColor={c2} />
          </LinearGradient>
        </Defs>

        {/* Trilha de fundo */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#e5e7eb"
          strokeWidth={STROKE}
          fill="none"
        />

        {/* Arco de progresso */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="url(#grad)"
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUM} ${CIRCUM}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>

      {/* Texto central */}
      <View style={styles.centerText}>
        <Text style={[styles.percentage, { color: c1 }]}>
          {pct.toFixed(0)}%
        </Text>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  sublabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
});
