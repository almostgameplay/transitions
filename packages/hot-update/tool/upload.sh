#!/bin/bash

debug=true
if [ "$1" == "1" ];then
  debug=false
fi

srcDir='../../../remote-assets/'
path=""
targetpath="/data/code/uploader/public/upload/games/petmarket/"
target=targetpath

if [ $debug = true ];then
   target=$targetpath"stage";else
   target=$targetpath"release"
fi

echo $path - $target

# cd  $path;
# tar -cf  remote.tar remote-assets/

# scp remote.tar  liukai@120.26.0.161:$target
# ssh "liukai@120.26.0.161" "cd $target; sudo tar -xf remote.tar; rm remote.tar"

# echo "finish $target";


