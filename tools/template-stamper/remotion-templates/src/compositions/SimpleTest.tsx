import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, interpolate} from 'remotion';

export interface SimpleTestProps {
  titleText: string;
  titleColor: string;
}

export const SimpleTest: React.FC<SimpleTestProps> = ({
  titleText = 'Hello World',
  titleColor = '#4A90E2',
}) => {
  const frame = useCurrentFrame();

  // Simple fade in animation
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Rotate animation
  const rotate = interpolate(frame, [0, 120], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Title text */}
      <Sequence from={0} durationInFrames={120}>
        <div
          style={{
            opacity,
            fontSize: 80,
            fontWeight: 'bold',
            color: titleColor,
            textAlign: 'center',
            padding: 40,
          }}
        >
          {titleText}
        </div>
      </Sequence>

      {/* Rotating square */}
      <Sequence from={30} durationInFrames={90}>
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            width: 200,
            height: 200,
            backgroundColor: titleColor,
            transform: `rotate(${rotate}deg)`,
          }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
