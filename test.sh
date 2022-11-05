
buildPath="./build/jsb-default"

node ./version_generator.js -v 2.0.0 -fv 1.5.0 -u http://192.168.1.85:8000/test/remote-assets/ -s $buildPath ./build/jsb-default -d ./

# move assets/, src/, version.manifest, project.manifest to server

# assetsPath = $buildPath + "/assets"
# srcPath = $buildPath + "/src"
# versionFile = ./version.manifest
# projectFile = ./project.manifest