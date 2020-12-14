# 介绍

`@siujs/cli`是一个基于`Monorepo`+`Typescript`为主基调风格的插件化前端应用脚手架, 让类库开发亦或多项目开发场景的人员更轻松以及更自由；

它主要提供以下几个平常项目开发过程中涉及到的操作而提起的命令：

- `siu init ...`：创建`monorepo`风格项目
- `siu create ...`：批量创建`monorepo`的`package`模块或子项目
- `siu deps ...`：批量的针对某些`package`执行`add/remove dev/peer/dependencies`操作
- `siu test ...`：处理不同`package`的单测、端测等
- `siu docs ...`：构建不同`package`的说明文档
- `siu glint ...`：处理整个团队项目的`git`提交规范验证以及其他 git 生命周期的个性化拦截处理等
- `siu build ...`：处理不同`package`的代码构建输出(可以同时支持 rollup、webpack4、webpack5 等)
- `siu publish ...`：处理不同`package`的发布流程亦或其他个性化

除去`init`其他命令都完全支持插件自定义;

> `@siujs/cli`也是由于本人在长期使用`lerna`之后发现其并没有很好的满足我的操作远景，最终还是决定造了这个轮子

## 脚手架设计

### Core

Core 是整个脚手架的核心包，提供了对开发者的插件定义 api 以及针对 cli 使用方的插件唤起等功能 api

### CLI

CLI 是直接处理控制台输入输出的包

### Cmd-\*

CMD-\* 是针对除去`test`、`docs`之外其他几个命令的默认备选逻辑处理，相当于零配置环境下的逻辑处理；
