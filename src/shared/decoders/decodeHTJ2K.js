import Module from '../../../codecs/openjphjs.js';

// require('../../../codecs/openjphjs.wasm');

function jph2raw(encodedFileBuffer, iterations = 1) {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line no-undef
      Module().then(openjphjs => {
        console.log(openjphjs);
        const decoder = new openjphjs.HTJ2KDecoder();
        const encodedBuffer = decoder.getEncodedBuffer(
          encodedFileBuffer.length
        );

        encodedBuffer.set(encodedFileBuffer);

        // do the actual benchmark
        //   const beginDecode = process.hrtime();

        for (let i = 0; i < iterations; i++) {
          decoder.decode();
        }
        //   const decodeDuration = process.hrtime(beginDecode); // hrtime returns seconds/nanoseconds tuple
        //   const decodeDurationInSeconds =
        //     decodeDuration[0] + decodeDuration[1] / 1000000000;

        // Print out information about the decode
        //   console.log(
        //     `Decode took ${(decodeDurationInSeconds / iterations) * 1000} ms`
        //   );
        const frameInfo = decoder.getFrameInfo();

        console.log('  frameInfo = ', frameInfo);
        console.log(' imageOffset = ', decoder.getImageOffset());
        const decoded = decoder.getDecodedBuffer();

        console.log('  decoded length = ', decoded.length);

        decoder.delete();

        return resolve(decoded);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 *
 * @param {*} imageFrame This is the DICOM headers describing the image frame
 * @param {*} pixelData This is the HTJ2K file as an ArrayBuffer
 * @returns
 */
async function decodeHTJ2K(imageFrame, pixelData) {
  imageFrame.pixelData = await jph2raw(Buffer.from(pixelData));

  return imageFrame;
}

export default decodeHTJ2K;
