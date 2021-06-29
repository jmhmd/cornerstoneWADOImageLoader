import decodeLittleEndian from './decoders/decodeLittleEndian.js';
import decodeBigEndian from './decoders/decodeBigEndian.js';
import decodeRLE from './decoders/decodeRLE.js';
import scaleArray from './scaling/scaleArray.js';
import externalDecoders from '../externalDecoders.js';

const {
  decodeJPEG2000,
  decodeJPEGLossless,
  decodeJPEGLS,
  decodeJPEGBaseline,
  decodeHTJ2K,
} = externalDecoders.decoders;

// eslint-disable-next-line complexity
function decodeImageFrame(
  imageFrame,
  transferSyntax,
  pixelData,
  decodeConfig,
  options
) {
  const start = new Date().getTime();

  let imageFramePromise;

  if (transferSyntax === '1.2.840.10008.1.2') {
    // Implicit VR Little Endian
    imageFramePromise = Promise.resolve(
      decodeLittleEndian(imageFrame, pixelData)
    );
  } else if (transferSyntax === '1.2.840.10008.1.2.1') {
    // Explicit VR Little Endian
    imageFramePromise = Promise.resolve(
      decodeLittleEndian(imageFrame, pixelData)
    );
  } else if (transferSyntax === '1.2.840.10008.1.2.2') {
    // Explicit VR Big Endian (retired)
    imageFramePromise = Promise.resolve(decodeBigEndian(imageFrame, pixelData));
  } else if (transferSyntax === '1.2.840.10008.1.2.1.99') {
    // Deflate transfer syntax (deflated by dicomParser)
    imageFramePromise = Promise.resolve(
      decodeLittleEndian(imageFrame, pixelData)
    );
  } else if (transferSyntax === '1.2.840.10008.1.2.5') {
    // RLE Lossless
    imageFramePromise = Promise.resolve(decodeRLE(imageFrame, pixelData));
  } else if (
    transferSyntax === '1.2.840.10008.1.2.4.50' &&
    decodeJPEGBaseline
  ) {
    // JPEG Baseline lossy process 1 (8 bit)
    imageFramePromise = Promise.resolve(
      decodeJPEGBaseline.decode(imageFrame, pixelData)
    );
  } else if (
    transferSyntax === '1.2.840.10008.1.2.4.51' &&
    decodeJPEGBaseline
  ) {
    // JPEG Baseline lossy process 2 & 4 (12 bit)
    imageFramePromise = Promise.resolve(
      decodeJPEGBaseline.decode(imageFrame, pixelData)
    );
  } else if (
    transferSyntax === '1.2.840.10008.1.2.4.57' &&
    decodeJPEGLossless
  ) {
    // JPEG Lossless, Nonhierarchical (Processes 14)
    imageFramePromise = Promise.resolve(
      decodeJPEGLossless.decode(imageFrame, pixelData)
    );
  } else if (
    transferSyntax === '1.2.840.10008.1.2.4.70' &&
    decodeJPEGLossless
  ) {
    // JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1])
    imageFramePromise = Promise.resolve(
      decodeJPEGLossless.decode(imageFrame, pixelData)
    );
  } else if (transferSyntax === '1.2.840.10008.1.2.4.80' && decodeJPEGLS) {
    // JPEG-LS Lossless Image Compression
    imageFramePromise = Promise.resolve(
      decodeJPEGLS.decode(imageFrame, pixelData)
    );
  } else if (transferSyntax === '1.2.840.10008.1.2.4.81' && decodeJPEGLS) {
    // JPEG-LS Lossy (Near-Lossless) Image Compression
    imageFramePromise = Promise.resolve(
      decodeJPEGLS.decode(imageFrame, pixelData)
    );
  } else if (transferSyntax === '1.2.840.10008.1.2.4.90' && decodeJPEG2000) {
    // JPEG 2000 Lossless
    imageFramePromise = Promise.resolve(
      decodeJPEG2000.decode(imageFrame, pixelData, decodeConfig, options)
    );
  } else if (transferSyntax === '1.2.840.10008.1.2.4.91' && decodeJPEG2000) {
    // JPEG 2000 Lossy
    imageFramePromise = Promise.resolve(
      decodeJPEG2000.decode(imageFrame, pixelData, decodeConfig, options)
    );
  } else if (transferSyntax === 'HTJ2K' && decodeHTJ2K) {
    // High Throughput JPEG 2000
    imageFramePromise = Promise.resolve(
      decodeHTJ2K.decode(imageFrame, pixelData)
    );
  } else {
    throw new Error(`no decoder for transfer syntax ${transferSyntax}`);
  }

  return imageFramePromise.then(decodedImageFrame => {
    /* Don't know if these work...
     // JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)
     else if(transferSyntax === "1.2.840.10008.1.2.4.92")
     {
     return decodeJPEG2000(dataSet, frame);
     }
     // JPEG 2000 Part 2 Multicomponent Image Compression
     else if(transferSyntax === "1.2.840.10008.1.2.4.93")
     {
     return decodeJPEG2000(dataSet, frame);
     }
     */

    const shouldShift =
      decodedImageFrame.pixelRepresentation !== undefined &&
      decodedImageFrame.pixelRepresentation === 1;
    const shift =
      shouldShift && decodedImageFrame.bitsStored !== undefined
        ? 32 - decodedImageFrame.bitsStored
        : undefined;

    if (shouldShift && shift !== undefined) {
      for (let i = 0; i < decodedImageFrame.pixelData.length; i++) {
        decodedImageFrame.pixelData[i] =
          // eslint-disable-next-line no-bitwise
          (decodedImageFrame.pixelData[i] << shift) >> shift;
      }
    }

    // Cache the pixelData reference quickly incase we want to set a targetBuffer _and_ scale.
    let pixelDataArray = decodedImageFrame.pixelData;

    if (options.targetBuffer) {
      // If we have a target buffer, write to that instead. This helps reduce memory duplication.
      const { arrayBuffer, offset, length, type } = options.targetBuffer;

      let TypedArrayConstructor;

      switch (type) {
        case 'Uint8Array':
          TypedArrayConstructor = Uint8Array;
          break;
        case 'Uint16Array':
          TypedArrayConstructor = Uint16Array;
          break;
        case 'Float32Array':
          TypedArrayConstructor = Float32Array;
          break;
        default:
          throw new Error('target array for image does not have a valid type.');
      }

      const imageFramePixelData = decodedImageFrame.pixelData;

      if (length !== imageFramePixelData.length) {
        throw new Error(
          'target array for image does not have the same length as the decoded image length.'
        );
      }

      const typedArray = new TypedArrayConstructor(arrayBuffer, offset, length);

      // TypedArray.Set is api level and ~50x faster than copying elements even for
      // Arrays of different types, which aren't simply memcpy ops.
      typedArray.set(imageFramePixelData, 0);

      // If need to scale, need to scale correct array.
      pixelDataArray = typedArray;
    }

    if (options.preScale) {
      const { scalingParameters } = options.preScale;

      scaleArray(pixelDataArray, scalingParameters);
    }

    const end = new Date().getTime();

    decodedImageFrame.decodeTimeInMS = end - start;

    return decodedImageFrame;
  });
}

export default decodeImageFrame;
