# siu create

> 创建基于`monorepo`的`package`模块

```bash
用法：siu create [options] <pkg>

选项：
  -d, --deps <deps> 需要依赖的同级package的名称
```

`siu create`此命令会优先从`siu.config.js`中去找到对应具备`create`hook 的插件并执行, 如果没有的话则默认走`@siujs/cmd-create`的逻辑去处理;

e.g:

- `siu create test`: will create `test` directory in `packages/test`
