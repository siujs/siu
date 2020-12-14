# siu create

> create `package` module of `monorepo` app

```bash
Usage: siu create [options] <pkg>

Create monorepo's package

Options:
  -d, --deps <deps>  name of siblings package, e.g. `pkg1` or `pkg1,pkg2`
```

`siu create` this command will search plugins which has hook `create` in `siu.config.js`，then invoke it ; otherwise will handle by `@siujs/cmd-create`;

e.g:

- `siu create test`: will create `test` directory in `packages/test`
