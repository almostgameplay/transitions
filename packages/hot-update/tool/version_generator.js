// 生成manifest文件
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var ServerUrl = "http://192.168.1.85:8000/petmarket/remote-assets/release/";
var TestServerUrl = "http://192.168.1.85:8000/petmarket/remote-assets/stage/";

var manifest = {
    packageUrl: ServerUrl,
    remoteManifestUrl: ServerUrl + "project.manifest",
    remoteVersionUrl: ServerUrl + "version.manifest",
    remoteApkUrl: ServerUrl + "latest.apk",
    version: "1.0.0",
    forceVersion: "1.0.0",
    assets: {},
    searchPaths: [],
};

var testManifest = {
    packageUrl: TestServerUrl,
    remoteManifestUrl: TestServerUrl + "project.manifest",
    remoteVersionUrl: TestServerUrl + "version.manifest",
    remoteApkUrl: TestServerUrl + "latest.apk",
};

var src = "./jsb/";

var updateLocal = 0;
// var localManifest = path.join(__dirname, "../../../assets/scripts/module", "project.manifest");
// var localTestManifest = path.join(__dirname, "../../../assets/scripts/module", "testProject.manifest");
var localManifest = path.join(__dirname, "../../../assets/resources", "project.manifest");
var localTestManifest = path.join(__dirname, "../../../assets/resources", "testProject.manifest");

var dest = "./remote-assets/release/";
var testDest = "./remote-assets/stage/";

// Parse arguments
var i = 2;
while (i < process.argv.length) {
    var arg = process.argv[i];

    switch (arg) {
        case "--url":
        case "-u":
            var url = process.argv[i + 1];
            manifest.packageUrl = url;
            manifest.remoteManifestUrl = url + "project.manifest";
            manifest.remoteVersionUrl = url + "version.manifest";
            i += 2;
            break;
        case "--version":
        case "-v":
            manifest.version = process.argv[i + 1];
            i += 2;
            break;
        case "--force-version":
        case "-fv":
            manifest.forceVersion = process.argv[i + 1];
            i += 2;
            break;
        case "--src":
        case "-s":
            src = process.argv[i + 1];
            i += 2;
            break;
        case "--dest":
        case "-d":
            dest = process.argv[i + 1];
            i += 2;
            break;
        case "-o":
            updateLocal = process.argv[i + 1];
            i += 2;
            break;
        default:
            i++;
            break;
    }
}
var mkdirSync = function (path) {
    try {
        fs.mkdirSync(path);
    } catch (e) {
        if (e.code != "EEXIST") throw e;
    }
};
mkdirSync(dest);

testDest = path.join(dest, "./stage");
dest = path.join(dest, "./release");
mkdirSync(testDest);
mkdirSync(dest);

function readDir(dir, obj) {
    var stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        return;
    }
    var subpaths = fs.readdirSync(dir),
        subpath,
        size,
        md5,
        compressed,
        relative;
    for (var i = 0; i < subpaths.length; ++i) {
        if (subpaths[i][0] === ".") {
            continue;
        }
        subpath = path.join(dir, subpaths[i]);
        stat = fs.statSync(subpath);
        if (stat.isDirectory()) {
            readDir(subpath, obj);
        } else if (stat.isFile()) {
            // Size in Bytes
            size = stat["size"];
            md5 = crypto.createHash("md5").update(fs.readFileSync(subpath)).digest("hex");
            compressed = path.extname(subpath).toLowerCase() === ".zip";

            relative = path.relative(src, subpath);
            relative = relative.replace(/\\/g, "/");
            relative = encodeURI(relative);
            obj[relative] = {
                size: size,
                md5: md5,
            };
            if (compressed) {
                obj[relative].compressed = true;
            }
        }
    }
}

// Iterate assets and src folder
readDir(path.join(src, "src"), manifest.assets);
readDir(path.join(src, "assets"), manifest.assets);

var destManifest = path.join(dest, "project.manifest");
var destVersion = path.join(dest, "version.manifest");

var testDestManifest = path.join(testDest, "project.manifest");
var testDestVersion = path.join(testDest, "version.manifest");

manifest.lastUpdateTimestamp = Date.now();
testManifest = { ...manifest, ...testManifest };
fs.writeFile(destManifest, JSON.stringify(manifest), (err) => {
    if (err) throw err;
    console.log("Manifest successfully generated");
});

fs.writeFile(testDestManifest, JSON.stringify(testManifest), (err) => {
    if (err) throw err;
    console.log("Manifest successfully generated");
});
if (updateLocal == 1) {
    fs.writeFile(localManifest, JSON.stringify(manifest), (err) => {
        if (err) throw err;
        console.log("Manifest successfully updated");
    });
    fs.writeFile(localTestManifest, JSON.stringify(testManifest), (err) => {
        if (err) throw err;
        console.log("Manifest successfully updated");
    });
}
delete manifest.assets;
delete manifest.searchPaths;

delete testManifest.assets;
delete testManifest.searchPaths;

fs.writeFile(destVersion, JSON.stringify(manifest), (err) => {
    if (err) throw err;
    console.log("Version successfully generated");
});

fs.writeFile(testDestVersion, JSON.stringify(testManifest), (err) => {
    if (err) throw err;
    console.log("Version successfully generated");
});
