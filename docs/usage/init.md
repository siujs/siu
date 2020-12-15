# siu init

> initialize application

> dependens on `@siujs/cli-init`

```js
Usage: siu init [options] <template> <app>

Generate project from a remote template

Options:
  -s,--source <source>  source of template: gitlab、github、gitee or self private git-repo url
```

`siu init` command will download the corresponding project template in the form of remote git repo by default, and then perform some internal processing;

e.g :

- `siu init @foo/bar` : will download from `https://github.com/foo/bar`
- `siu init bar` : will download from `https://github.com/bar`
- `siu init foo:dev`: will download from `https://github.com/foo` and branch `dev`
- `siu init git@foo`: will download from `git@foo`
- `siu init https://xxx/foo`: will download from `https://xxx/foo`;
- `siu init foo --source=gitee`: will download from `https://gitee.com/foo`
