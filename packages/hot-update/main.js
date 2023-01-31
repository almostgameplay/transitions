"use strict";

var fss = require("fs");
var Fs = require("fire-fs");
var Path = require("fire-path");
var childProcess = require("child_process");
var { shell } = require("electron");

let toolDir = Path.join(__dirname, "tool");
let localServer = Path.join(__dirname, "../../../");
let localServerAssetDir = Path.join(__dirname, "../../remote-assets/");
var configFile = Path.join(__dirname, "../../hconfig.json");

function SaveConfig(path, data) {
    fss.writeFile(path, data, function (error) {
        if (error) {
            Editor.log(error);
            throw err;
        }
        Editor.log("hotupdate:saved config");
    });
}

function ReadConfig(cb) {
    fss.readFile(configFile, "utf8", (err, data) => {
        cb && cb(err, data);
    });
}

var inject_script = `
(function () {
    if (typeof window.jsb === 'object') {
        var hotUpdateSearchPaths = localStorage.getItem('HotUpdateSearchPaths');
        if (hotUpdateSearchPaths) {
            var paths = JSON.parse(hotUpdateSearchPaths);
            jsb.fileUtils.setSearchPaths(paths);

            var fileList = [];
            var storagePath = paths[0] || '';
            var tempPath = storagePath + '_temp/';
            var baseOffset = tempPath.length;

            if (jsb.fileUtils.isDirectoryExist(tempPath) && !jsb.fileUtils.isFileExist(tempPath + 'project.manifest.temp')) {
                jsb.fileUtils.listFilesRecursively(tempPath, fileList);
                fileList.forEach(srcPath => {
                    var relativePath = srcPath.substr(baseOffset);
                    var dstPath = storagePath + relativePath;

                    if (srcPath[srcPath.length] == '/') {
                        jsb.fileUtils.createDirectory(dstPath)
                    }
                    else {
                        if (jsb.fileUtils.isFileExist(dstPath)) {
                            jsb.fileUtils.removeFile(dstPath)
                        }
                        jsb.fileUtils.renameFile(srcPath, dstPath);
                    }
                })
                jsb.fileUtils.removeDirectory(tempPath);
            }
        }
    }
})();
`;

module.exports = {
    load: function () {
        // 当 package 被正确加载的时候执行
        Editor.log("hotupdate extension load");
    },

    unload: function () {
        // 当 package 被正确卸载的时候执行
    },

    messages: {
        "editor:build-finished": function (event, target) {
            var root = Path.normalize(target.dest);
            var url = Path.join(root, "main.js");
            Fs.readFile(url, "utf8", function (err, data) {
                if (err) {
                    throw err;
                }

                var newStr = inject_script + data;
                Fs.writeFile(url, newStr, function (error) {
                    if (err) {
                        throw err;
                    }
                    Editor.log("SearchPath updated in built main.js for hot update");
                });
            });
        },
        "open-editor"(event) {
            Editor.Panel.open("hot-update");
        },
        "start-build"(event, args) {
            Editor.log(JSON.stringify(args));

            try {
                let sh = Path.join(toolDir, "version_generator.js");
                var { serverPath, assetPath, updateLocal } = args;
                var param = ` -v ${args.version} -fv ${
                    args.fversion
                } -u ${serverPath} -s ${assetPath} -d ${localServerAssetDir} -o ${updateLocal ? 1 : 0}`;
                childProcess.execSync("node " + sh + param);
                Editor.Ipc.sendToPanel("hot-update", "update-status", "已生成manifest ==> " + localServerAssetDir);
                Editor.assetdb.refresh("db://assets/resources/project.manifest");
                Editor.assetdb.refresh("db://assets/resources/testProject.manifest");
                SaveConfig(configFile, JSON.stringify(args));
            } catch (e) {
                Editor.success(e);
                Editor.Ipc.sendToPanel("hot-update", "update-status", e);
            }
        },
        "start-upload"(event, args) {
            try {
                let sh = Path.join(toolDir, "uploader.js");
                var { serverPath, assetPath, stage } = args;
                var param = ` -s ${serverPath} -a ${assetPath} -stage ${stage ? 1 : 0}`;
                childProcess.execSync("node " + sh + param);
                Editor.Ipc.sendToPanel(
                    "hot-update",
                    "update-status",
                    "资源上传成功!" + (stage ? `${localServerAssetDir}stage/` : serverPath)
                );
            } catch (e) {
                Editor.success(e);
                Editor.Ipc.sendToPanel("hot-update", "update-status", e);
            }
        },
        "start-local"(event, args) {
            try {
                Editor.log("start-local");
                var childProcess = require("child_process");
                var port = args.port || 8000;
                childProcess.exec(
                    `cd ${localServer} && python -m SimpleHTTPServer ${port}`,
                    function (err, stdout, stderr) {
                        console.log(err, stderr, stdout);
                    }
                );
                shell.openExternal(`http://localhost:${port}/petmarket/`);
            } catch (error) {
                Editor.success(e);
            }
        },
        "panel-ready"(event, args) {
            if (event.reply) {
                ReadConfig((err, config) => {
                    event.reply(err, config);
                });
            }
        },
    },
};
