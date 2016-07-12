
(function ($, cornerstone, cornerstoneWADOImageLoader) {

  "use strict";

  function getTransferSyntaxForContentType(contentType) {
    return '1.2.840.10008.1.2'; // hard code to ILE for now
  }

  function loadImage(imageId) {
    var start = new Date().getTime();

    var deferred = $.Deferred();
    
    var uri = imageId.substring(7);
    
    // check to make sure we have metadata for this imageId
    var metaData = cornerstoneWADOImageLoader.wadors.metaDataManager.get(imageId);
    if(metaData === undefined) {
      deferred.reject('no metadata for imageId ' + imageId);
      return deferred.promise();
    }

    var mediaType;// = 'image/dicom+jp2';

    // get the pixel data from the server
    cornerstoneWADOImageLoader.wadors.getPixelData(uri, imageId, mediaType).then(function(result) {

      var metaDataProvider = cornerstoneWADOImageLoader.wadors.metaDataProvider;
      var transferSyntax = getTransferSyntaxForContentType(result.contentType);
      var pixelData = result.imageFrame;
      var imagePromise = cornerstoneWADOImageLoader.createImage(imageId, pixelData, transferSyntax, metaDataProvider);
      imagePromise.then(function(image) {
        // add the loadTimeInMS property
        var end = new Date().getTime();
        image.loadTimeInMS = end - start;
        deferred.resolve(image);
      })
    }).fail(function(reason) {
      deferred.reject(reason);
    });

    return deferred.promise();
  }

  // register wadors scheme
  cornerstone.registerImageLoader('wadors', loadImage);

}($, cornerstone, cornerstoneWADOImageLoader));