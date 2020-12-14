# siu build

> 执行指定包的打包操作，可批量

```bash
用法：siu build [options] [pkgs]

选项：
  -f, --format <format>  可输出的打包类型： `es`、`cjs`、`umd`、`umd-min`
```

`siu build`此命令会优先从`siu.config.js`中去找到对应具备`build`hook 的插件并执行, 如果没有的话则默认走`@siujs/cmd-build`的逻辑去处理;

`@siujs/cmd-build`除了作为`siu build`的垫片, 还提供了关于自定义`rollup`、`webpack`配置的构建器，主要服务于 siu 插件开发

**`Note`**

- 如果`pkgs`没有填写，那么默认会去执行全模块打包
- `pkgs`支持的名称有两种
  - 当前 package 的`文件夹名称`
  - 当前 package 在 package.json 中定义的`name`
- `umd-min`是表示需要执行`mini`处理的`umd`输出模式
