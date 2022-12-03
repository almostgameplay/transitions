var fs = require("fs");
var path = require("path");

var i = 0;
assetDir = "";
while (i < process.argv.length) {
    var arg = process.argv[i];

    switch (arg) {
      
        case "--assets":
        case "-a":
            assetDir = process.argv[i + 1];
            i += 2;
            break;
        default:
            i++;
            break;
    }
}

if(!assetDir) return;


var ImageType = {
    PNG: "png",
    JPG: "jpg",
    JPEG: "jpeg",
};

const _keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const randomString = (length) => {
    let str = "";
    for (let i = 0; i < length; i++) {
        str += _keys[Math.floor((_keys.length - 1) * Math.random())];
    }
    return str;
};

const _collectImageFilePaths = (dirName, imgs) => {
    if (!fs.existsSync(dirName)) {
        throw new Error(`${dirName} 目录不存在`);
    }

    let files = fs.readdirSync(dirName);
    files.forEach((fileName) => {
        let filePath = path.join(dirName, fileName.toString());
        let stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            _collectImageFilePaths(filePath, imgs);
        } else {
            let fileExtName = path.extname(filePath);
            switch (fileExtName) {
                case ".png":
                    imgs.push({
                        type: ImageType.PNG,
                        filePath: filePath,
                    });
                    break;
                case ".jpg":
                    imgs.push({
                        type: ImageType.JPG,
                        filePath: filePath,
                    });
                    break;
                case ".jpeg":
                    imgs.push({
                        type: ImageType.JPEG,
                        filePath: filePath,
                    });
                    break;
            }
        }
    });
};
var doEncryp = (rawStr) => rawStr + randomString(10);

var _encryptImage = (imgs) => {
    imgs.forEach((imgObj) => {
        let imgBuffer = fs.readFileSync(imgObj.filePath);
        if (imgBuffer.toString().startsWith("data")) {
            return;
        }
        let imgBase64String = "";
        switch (imgObj.type) {
            case ImageType.PNG:
                imgBase64String += "data:image/png;base64,";
                break;
            case ImageType.JPG:
                imgBase64String += "data:image/jpg;base64,";
                break;
            case ImageType.JPEG:
                imgBase64String += "data:image/jpeg;base64,";
                break;
            case ImageType.GIF:
                imgBase64String += "data:image/gif;base64,";
                break;
            case ImageType.WEBP:
                imgBase64String += "data:image/webp;base64,";
                break;
        }
        imgBase64String += imgBuffer.toString("base64");
        imgBase64String = doEncryp(imgBase64String);
        // 最后加上10位随机数
        fs.writeFileSync(imgObj.filePath, imgBase64String);
    });
};

function handleImage(dirPath) {
    // 收集输出目录图片文件
    // let str = "./build/quickgame/remote/";
    // let outDir = path.join(__dirname, str);
    let outDir = dirPath;
    let imgs = [];
    _collectImageFilePaths(outDir, imgs);
    console.log(`图片处理：找到 ${imgs.length} 张原始图片`);

    // 加密图片文件
    _encryptImage(imgs);
    console.log(`图片处理：${imgs.length} 张原始图片已加密完成`);
}

handleImage(assetDir);
