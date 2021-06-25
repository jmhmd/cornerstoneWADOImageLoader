import { getOptions } from './options.js';

function xhrRequest(url, headers = {}) {
  const options = getOptions();

  // Change 'url/file.jph' to 'url/file.metadata.dcm'
  const metadataUrl = `${url.replace(/\.[^/.]+$/, '')}.metadata.dcm`;

  const errorInterceptor = xhr => {
    if (typeof options.errorInterceptor === 'function') {
      const error = new Error('request failed');

      error.request = xhr;
      error.response = xhr.response;
      error.status = xhr.status;
      options.errorInterceptor(error);
    }
  };

  // Make the request for the .metadata.dcm DICOM P10 file
  return new Promise((resolve, reject) => {
    const xhrMetadata = new XMLHttpRequest();

    xhrMetadata.open('get', metadataUrl, true);
    xhrMetadata.responseType = 'arraybuffer';

    Object.keys(headers).forEach(function(key) {
      xhrMetadata.setRequestHeader(key, headers[key]);
    });

    // handle response data
    xhrMetadata.onreadystatechange = function() {
      // Default action
      // TODO: consider sending out progress messages here as we receive the pixel data
      if (xhrMetadata.readyState === 4) {
        if (xhrMetadata.status === 200) {
          options
            .beforeProcessing(xhrMetadata)
            .then(resolve)
            .catch(() => {
              errorInterceptor(xhrMetadata);
              // request failed, reject the Promise
              reject(xhrMetadata);
            });
        } else {
          errorInterceptor(xhrMetadata);
          // request failed, reject the Promise
          reject(xhrMetadata);
        }
      }
    };

    xhrMetadata.onerror = function() {
      errorInterceptor(xhrMetadata);
      reject(xhrMetadata);
    };

    xhrMetadata.onabort = function() {
      errorInterceptor(xhrMetadata);
      reject(xhrMetadata);
    };
    xhrMetadata.send();
  });
}

export default xhrRequest;
