import { default as xhrRequest } from './xhrRequest.js';
import { default as xhrRequestMetadata } from './xhrRequestMetadata.js';
import { setOptions, getOptions } from './options.js';

const internal = {
  xhrRequest,
  xhrRequestMetadata,
  setOptions,
  getOptions,
};

export { setOptions, getOptions, xhrRequest, xhrRequestMetadata, internal };
