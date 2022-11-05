transition
https://forum.cocos.org/t/2-3-0/88861

hotupdate
https://forum.cocos.org/t/creator-zip/98218
https://docs.cocos.com/creator/2.4/manual/zh/advanced-topics/assets-manager.html

#### 流程

1. 首次构建资源后，生成 project.manifest 文件，随包上架
2. 更新代码资源火，构建资源，生成对应版本的 project.manifest,version.manifest,将最新构建的资源(assets/,src/)和配置文件上传到服务器

TODO:

-   [x]热更逻辑交互代码优化
-   [x]热更逻辑代码与 UI 逻辑分离
-   [x]强更逻辑补充
-   散列资源如何优化
-   资源，版本号管理上传
