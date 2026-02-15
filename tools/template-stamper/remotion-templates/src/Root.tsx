import React from 'react';
import {Composition} from 'remotion';
import {VeoShortsV1} from './compositions/VeoShortsV1';
import {SimpleTest} from './compositions/SimpleTest';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="simple-test"
        component={SimpleTest}
        durationInFrames={120}
        fps={30}
        width={720}
        height={1280}
        defaultProps={{
          titleText: 'Template Stamper Test',
          titleColor: '#4A90E2',
        }}
      />

      <Composition
        id="veo-shorts-v1"
        component={VeoShortsV1}
        durationInFrames={420} // 17.5 seconds at 24fps
        fps={24}
        width={720}
        height={1280}
        defaultProps={{
          gridImage1: 'https://via.placeholder.com/720x1280.jpg?text=Grid+1',
          gridImage2: 'https://via.placeholder.com/720x1280.jpg?text=Grid+2',
          gridImage3: 'https://via.placeholder.com/720x1280.jpg?text=Grid+3',
          gridImage4: 'https://via.placeholder.com/720x1280.jpg?text=Grid+4',
          gridImage5: 'https://via.placeholder.com/720x1280.jpg?text=Grid+5',
          gridImage6: 'https://via.placeholder.com/720x1280.jpg?text=Grid+6',
          gridImage7: 'https://via.placeholder.com/720x1280.jpg?text=Grid+7',
          gridImage8: 'https://via.placeholder.com/720x1280.jpg?text=Grid+8',
          gridImage9: 'https://via.placeholder.com/720x1280.jpg?text=Grid+9',
          selectedImage1: 'https://via.placeholder.com/400x400.jpg?text=Selected+1',
          selectedImage2: 'https://via.placeholder.com/400x400.jpg?text=Selected+2',
          promptText: 'Show me and my cat skydiving',
          generatedVideo: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        }}
      />
    </>
  );
};
