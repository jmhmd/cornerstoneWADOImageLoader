(function (cornerstoneWADOImageLoader) {

    "use strict";

    function getWindowWidthAndCenter(dataSet)
    {
        // NOTE - Default these to undefined since they may not be present as
        // they are not present or required for all sop classes.  We leave it up
        // to a higher layer to determine reasonable default values for these
        // if they are not provided.  We also use the first ww/wc values if
        // there are multiple and again leave it up the higher levels to deal with
        // this
        var result = {
            windowCenter : undefined,
            windowWidth: undefined
        };

        if(dataSet.elements.x00281050 && dataSet.elements.x00281051) {
          result.windowCenter = dataSet.floatString('x00281050');
          result.windowWidth = dataSet.floatString('x00281051');
        }

        return result;
    }

    // module exports
    cornerstoneWADOImageLoader.getWindowWidthAndCenter = getWindowWidthAndCenter;
}(cornerstoneWADOImageLoader));