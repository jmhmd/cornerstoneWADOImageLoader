/* eslint import/extensions:0 */
import registerLoaders from './imageLoader/registerLoaders.js';

let cornerstone;

let dicomParser;

const external = {
  set cornerstone(cs) {
    cornerstone = cs;

    registerLoaders(cornerstone);
  },
  get cornerstone() {
    if (!cornerstone) {
      if (window && window.cornerstone) {
        cornerstone = window.cornerstone;

        registerLoaders(cornerstone);
      } else {
        throw new Error(
          'cornerstoneWADOImageLoader requires a copy of Cornerstone to work properly. Please add cornerstoneWADOImageLoader.external.cornerstone = cornerstone; to your application.'
        );
      }
    }

    return cornerstone;
  },
  set dicomParser(dp) {
    dicomParser = dp;
  },
  get dicomParser() {
    if (!dicomParser) {
      if (window && window.dicomParser) {
        dicomParser = window.dicomParser;
      } else {
        throw new Error(
          'cornerstoneWADOImageLoader requires a copy of dicomParser to work properly. Please add cornerstoneWADOImageLoader.external.dicomParser = dicomParser; to your application.'
        );
      }
    }

    return dicomParser;
  },
  get decoders() {
    return {
      decodeJPEG2000: window &&
        window.decodeJpeg2000 && {
          decode: window.decodeJpeg2000.default,
          initialize: window.decodeJpeg2000.initializeJPEG2000,
        },
      decodeJPEGLossless: window &&
        window.decodeJpegLossless && {
          decode: window.decodeJpegLossless.default,
        },
      decodeJPEGLS: window &&
        window.decodeJpegLS && {
          decode: window.decodeJpegLS.default,
          initialize: window.decodeJpegLS.initializeJPEGLS,
        },
      decodeJPEGBaseline: window &&
        window.decodeJpegBaseline && {
          decode: window.decodeJpegBaseline.default,
        },
      decodeHTJ2K: window &&
        window.decodeHtj2k && {
          decode: window.decodeHtj2k.default,
        },
    };
  },
};

export default external;
