import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  Img,
  Video,
  staticFile,
} from 'remotion';

export interface VeoShortsV1Props {
  gridImage1: string;
  gridImage2: string;
  gridImage3: string;
  gridImage4: string;
  gridImage5: string;
  gridImage6: string;
  gridImage7: string;
  gridImage8: string;
  gridImage9: string;
  selectedImage1: string;
  selectedImage2: string;
  promptText: string;
  generatedVideo: string;
}

export const VeoShortsV1: React.FC<VeoShortsV1Props> = ({
  gridImage1,
  gridImage2,
  gridImage3,
  gridImage4,
  gridImage5,
  gridImage6,
  gridImage7,
  gridImage8,
  gridImage9,
  selectedImage1,
  selectedImage2,
  promptText,
  generatedVideo,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* Section 1: Grid Screen (0:00 - 0:02.5 = 0-60 frames) */}
      <Sequence from={0} durationInFrames={60}>
        <GridScreen
          images={[
            gridImage1,
            gridImage2,
            gridImage3,
            gridImage4,
            gridImage5,
            gridImage6,
            gridImage7,
            gridImage8,
            gridImage9,
          ]}
        />
      </Sequence>

      {/* Section 2: Prompt Screen (0:02.5 - 0:06.25 = 60-150 frames) */}
      <Sequence from={60} durationInFrames={90}>
        <PromptScreen
          selectedImage1={selectedImage1}
          selectedImage2={selectedImage2}
          promptText={promptText}
        />
      </Sequence>

      {/* Section 3-4: Result Display (0:06.25 - 0:15 = 150-360 frames) */}
      <Sequence from={150} durationInFrames={210}>
        <ResultScreen generatedVideo={generatedVideo} />
      </Sequence>

      {/* Section 5: Branding End Card (0:15 - 0:17.5 = 360-420 frames) */}
      <Sequence from={360} durationInFrames={60}>
        <BrandingScreen />
      </Sequence>
    </AbsoluteFill>
  );
};

// Section 1: Grid Screen Component
const GridScreen: React.FC<{images: string[]}> = ({images}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        padding: 40,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{color: '#fff', fontSize: 24}}>Recents ▼</div>
        <div style={{color: '#fff', fontSize: 32}}>✕</div>
      </div>

      {/* 3x3 Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          flex: 1,
        }}
      >
        {images.map((img, i) => {
          const delay = i * 3;
          const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                aspectRatio: '9/16',
                borderRadius: 8,
                overflow: 'hidden',
                opacity,
              }}
            >
              <Img
                src={img}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Done Button */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 24,
          padding: '12px 0',
          textAlign: 'center',
          marginTop: 20,
        }}
      >
        <div style={{color: '#000', fontSize: 20, fontWeight: 'bold'}}>
          Done
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Section 2: Prompt Screen Component
const PromptScreen: React.FC<{
  selectedImage1: string;
  selectedImage2: string;
  promptText: string;
}> = ({selectedImage1, selectedImage2, promptText}) => {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #0f3460 0%, #16213e 100%)',
        padding: 40,
      }}
    >
      {/* Selected Images */}
      <div style={{display: 'flex', gap: 16, marginBottom: 24}}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <Img
            src={selectedImage1}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </div>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <Img
            src={selectedImage2}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </div>
      </div>

      {/* Prompt Text Box */}
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div style={{color: '#fff', fontSize: 18, lineHeight: 1.5}}>
          {promptText}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Section 3-4: Result Display Component
const ResultScreen: React.FC<{generatedVideo: string}> = ({
  generatedVideo,
}) => {
  return (
    <AbsoluteFill>
      <Video
        src={generatedVideo}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </AbsoluteFill>
  );
};

// Section 5: Branding End Card Component
const BrandingScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 120,
          height: 120,
          backgroundColor: '#FF0000',
          borderRadius: 60,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div style={{color: '#fff', fontSize: 48, fontWeight: 'bold'}}>V</div>
      </div>

      {/* Tagline */}
      <div style={{color: '#fff', fontSize: 28, fontWeight: 'bold'}}>
        Create with Veo on Shorts
      </div>
    </AbsoluteFill>
  );
};
