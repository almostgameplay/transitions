[思路参考](https://forum.cocos.org/t/cocos-creator/95492)
[asset 相关](https://forum.cocos.org/t/topic/103956)
通过注册 download,parse 过程来自定义资源加载流程，从而达到加解密目的

TODO:

1. responseType blob 类型转换的 base64 跟资源数据不同，找找原因(目前通过 text 类型来获取数据) (new Blob(xhr.response))
2. 本地 rpk 包内的资源兼容(研究下小游戏的协议) (目前本地资源不加密，通过区分 http 来执行不同的下载解析)
3. oppo 测试时有布局错乱,加载地图失败问题(tile?)
 <!-- test -->

https://cdn.wanhuahai.com/upload/games/mecha/oppo
http://192.168.1.85:8888/
