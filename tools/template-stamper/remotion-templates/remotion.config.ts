import {Config} from '@remotion/cli/config';

// Video output settings
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');

// Performance settings
Config.setConcurrency(4);
