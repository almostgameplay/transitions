替换引擎文件

### NOTE
SSL 问题导致无法下载,更新pip: sudo curl https://bootstrap.pypa.io/pip/2.7/get-pip.py | python

No option 'cxxgeneratordir' in section: 'DEFAULT' 问题: 修改 binding-generator/generator.py 文件 line: 1805,userconf.ini的路径注意对不对(最好改成绝对路径) [forum](https://forum.cocos.org/t/jsb-cocos-creator-2-4-0/97010)

Errors in parsing headers问题，检查ndk版本，目前  <=21 应该都可以