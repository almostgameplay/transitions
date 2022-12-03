[方案讨论](https://forum.cocos.org/t/creator-zip/98218)
[assetsmanager](https://docs.cocos.com/creator/2.4/manual/zh/advanced-topics/assets-manager.html)
[官方](https://github.com/cocos-creator/cocos-tutorial-hot-update)

> 源码 resources\.editors\Creator\2.4.9\resources\cocos2d-x\extensions\assets-manager

#### 流程

1. 首次构建资源后，生成 project.manifest, testProject.manifest 文件，随包上架
2. 更新代码资源后，构建资源，生成对应版本的 project.manifest,version.manifest,将最新构建的资源(assets/,src/)和配置文件上传到服务器
3. 每次发布新 apk 包，注意更新包内的 project.manifest 文件(scripts/module/project.manifest),更新后需要重新构建
4. manifest 通过 genManifest.sh 生成
5. testProject.manifest 指测试环境(staging)下的本地文件，指向测试服务器(本地留开关切换测试/发布)

> 操作步骤:(构建，更新项目内 manifest，再构建，上传服务器，打 apk) 注意 hotupdate 节点引用的两个 manifest 资源
> python -m SimpleHTTPServer 8000 // python3.10.exe -m http.server
> netstat -ano |findstr "8000" ; taskkill /f /t /im **pid**

#### TODO:

-   [x]热更逻辑交互代码优化
-   [x]热更逻辑代码与 UI 逻辑分离
-   [x]强更逻辑补充
-   散列资源如何优化
-   发 apk 时本地 project 文件如何快速替换(现在需要手动替换后，再重新构建)
-   [x]脚本可视化插件(资源，版本号管理上传)
-   [x]流程脚本优化
-   [x]配置记录上 git
-   md5 检查
-   ~~回滚(不同热更版本资源，存放在独立文件夹?) 重发稳定版~~
-   [x]热更测试环境 (本地 debug 开关? 代理重定向到测试服务器? 读取远程配置文件?)
    > 目前本地开关，指向测试服务器

#### 测试

-   [x]热更热启动和冷启动
-   [x]大版本覆盖更新是否正常
-   [x]场景中替换 serachpath 重启
-   [x]热更版本比新 apk 版本高时，覆盖更新再热更是否有问题，是否需要先清理然后再进行热更 (先安装 apk 1.0,然后更新热更 1.1， 然后更新 1.2,覆盖安装 apk 1.2，, 再更新热更 1.3)
-   hotupdate 插件注入代码不稳定，可能会导致 searchPath 更新不及时，需要多测试(导致的问题是热启动正常，冷启动时未更新) (可在游戏开始前增加场景来处理，可保证 searchPaths 正常)
-   ??覆盖安装要重置 searchPaths,清理之前热更的文件(测试测试测试)

#### NOTE

-   manifest 文件本地有缓存，不会覆盖新的(切换生产测试环境时要注意)
