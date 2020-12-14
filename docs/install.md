# Installation

To install the new package, use one of the following commands. You need administrator privileges to execute these unless npm was installed on your system through a Node.js version manager (e.g. n or nvm).

```bash
npm install -g @siujs/cli
# OR
yarn global add @siujs/cli
```

After installation, you will have access to the `siu` binary in your command line. You can verify that it is properly installed by simply running `siu`, which should present you with a help message listing all available commands.

You can check you have the right version with this command:

```bash
siu -V
# OR
siu --version
```

# Upgrading

To upgrade the global Siu CLI package, you need to run:

```bash
npm update -g @siujs/cli
# OR
yarn global upgrade --latest @siujs/cli
```
