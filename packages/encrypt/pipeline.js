const parseParameters = (options, onProgress, onComplete) => {
    if (onComplete === undefined) {
        var isCallback = typeof options === "function";
        if (onProgress) {
            onComplete = onProgress;
            if (!isCallback) {
                onProgress = null;
            }
        } else if (onProgress === undefined && isCallback) {
            onComplete = options;
            options = null;
            onProgress = null;
        }
        if (onProgress !== undefined && isCallback) {
            onProgress = options;
            options = null;
        }
    }
    options = options || Object.create(null);
    return { options, onProgress, onComplete };
};

const imgParser = (file, options, onComplete) => {
    if(typeof file !== 'string'){
        console.log("File",file);
        //交还给默认
        cc.assetManager.parser.parseImage(file,options,onComplete)
        return;
    } 
    var base64data = file;
    let img = new Image();
    base64data = base64data.substring(0, base64data.length - 10);

    function loadCallback () {
        img.removeEventListener('load', loadCallback);
        img.removeEventListener('error', errorCallback);
        onComplete && onComplete(null, img);
    }
    
    function errorCallback () {
        img.removeEventListener('load', loadCallback);
        img.removeEventListener('error', errorCallback);
        onComplete && onComplete(new Error(cc.debug.getError(4930, url)));
    }

    img.addEventListener('load', loadCallback);
    img.addEventListener('error', errorCallback);

    img.src = base64data;
    // return;
    // read blob result
    // var reader = new FileReader();
    // reader.readAsDataURL(file);
    // reader.onloadend = function () {
    //     var base64data = reader.result;
    //     let img = new Image();
    //     base64data = base64data.substring(0, base64data.length - 10);
    //     img.src = base64data;
    //     onComplete && onComplete(null, img);
    // };
};

const replaceBinURL = function (task, done) {
    const input = (task.output = task.input);
    for (let index = 0; index < input.length; index++) {
        const element = input[index];
        let item = input[index];

        if (!item.url) continue;

        item.url = item.url.replace(".bin", ".dbbin");
    }
    return null;
};
var downloadText = function (url) {
    var result = jsb.fileUtils.getStringFromFile(url);

    if (typeof result === "string" && result) {
        return result;
    } else {
        return new Error("Download text failed: " + url);
    }
};
const REGEX = /^https?:\/\/.*/;

var downloadImage = function (url, options, onComplete) {
    console.log("downloadImage", url, CC_JSB?"原生":"web");
    if (CC_JSB) {
        // 原生直接读文件
        var res = downloadText(url);
        onComplete && onComplete(null, res);
        return;
    }  else {
        if (!REGEX.test(url)) {
            console.log("downloadimage default");
            cc.assetManager.downloader.downloadDomImage(url, options, onComplete);
            // downloadDomImageBase64(url,options,onComplete);
        } else {
            console.log("downloadimage xhr text");
            options.responseType = "text";
            cc.assetManager.downloader.downloadFile(url, options, options.onFileProgress, onComplete);
        }
    }
};

//test local
function downloadDomImageBase64 (url, options, onComplete) {
    var ext = url.split(".")[1];
    cc.assetManager.downloader.downloadDomImage(url,options,(err,img) => {
        if(err) return;
        var baseStr = img2Base64(img,ext);
        onComplete && onComplete(null,baseStr);
    })
}

function img2Base64(image,ext='png'){
    let canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    let context = canvas.getContext('2d');
    // 解决图片转base64透明部分填充成黑色问题
    context.fillStyle = "rgba(1,1,1,0)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, image.width, image.height);
    let quality = 1;
    let dataURL = canvas.toDataURL(`image/${ext}`, quality);
    dataURL += "1234567890"
    return dataURL;
}

(function () {
    if (CC_DEBUG) {
        return;
    }
    // cc.assetManager.transformPipeline.append(replaceBinURL);
    cc.assetManager.downloader.register(".png", downloadImage);
    cc.assetManager.downloader.register(".jpg", downloadImage);
    cc.assetManager.parser.register(".png", imgParser);
    cc.assetManager.parser.register(".jpg", imgParser);
})();
