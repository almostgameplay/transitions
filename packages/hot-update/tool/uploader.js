// 移动构建资源到本地remote-assets文件夹，上传到远程服务器

var fs = require("fs");
var path = require("path");

var projectDir = path.join(__dirname, "../../../build/jsb-link");
var destDir = path.join(__dirname, "../../../remote-assets/release");
var stageDestDir = path.join(__dirname, "../../../remote-assets/stage");

var serverUrl = "http://192.168.1.85:8000/petmarket/remote-assets/release/";

var isStage = 0;
var i = 2;
while (i < process.argv.length) {
    var arg = process.argv[i];

    switch (arg) {
        case "--server":
        case "-s":
            serverUrl = process.argv[i + 1];
            i += 2;
            break;
        case "--assets":
        case "-a":
            projectDir = process.argv[i + 1];
            i += 2;
            break;
        case "-stage":
            isStage = process.argv[i + 1];
            i += 2;
            break;
        default:
            i++;
            break;
    }
}

var srcDir = path.join(projectDir, "src");
var assetDir = path.join(projectDir, "assets");

var sourceManifest = path.join(__dirname, "project.manifest");
var sourceVersion = path.join(__dirname, "version.manifest");

var destManifest = path.join(destDir, "project.manifest");
var destVersion = path.join(destDir, "version.manifest");

function MoveFileTo(sourceFile, destPath) {
    fs.rename(sourceFile, destPath, function (err) {
        if (err) throw err;
        fs.stat(destPath, function (err, stats) {
            if (err) throw err;
            console.log("stats: " + JSON.stringify(stats));
        });
    });
}

function CopyFileTo(sourceFile, destFile) {
    // var readStream = fs.createReadStream(sourceFile);
    // var writeStream = fs.createWriteStream(destFile);
    // readStream.pipe(writeStream);
    fs.cpSync(sourceFile, destFile);
}
function CopyDirTo(sourceDir, destDir) {
    fs.cpSync(sourceDir, destDir, { recursive: true, force: true }, (err) => {
        if (err) {
            console.log(`copy ${sourceDir} to ${destDir} faildd`, err);
        }
    });
}

function UploadToServer() {
    CopyDirTo(srcDir, path.join(destDir, "src"));
    CopyDirTo(assetDir, path.join(destDir, "assets"));
    //TODO:
    // check remote version
    //upload remote-assets to server
}

function MoveToLocal() {
    CopyDirTo(srcDir, path.join(stageDestDir, "src"));
    CopyDirTo(assetDir, path.join(stageDestDir, "assets"));
}
if (isStage == 1) {
    MoveToLocal();
} else {
    UploadToServer();
}
