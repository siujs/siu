# siu init

> 初始化应用程序

> 依赖于`@siujs/cli-init`

```bash
用法: siu init [options] <template> <app>

选项:

  -s, --source <source> 项目模板来源： gitlab、github、gitee 或者私人git地址

```

`siu init`命令会默认通过远端 git repo 的形式去下载对应的项目模板，然后再对对应的一些内部处理;

e.g :

- `siu init @foo/bar` : will download from `https://github.com/foo/bar`
- `siu init bar` : will download from `https://github.com/bar`
- `siu init foo:dev`: will download from `https://github.com/foo` and branch `dev`
- `siu init git@foo`: will download from `git@foo`
- `siu init https://xxx/foo`: will download from `https://xxx/foo`;
- `siu init foo --source=gitee`: will download from `https://gitee.com/foo`
