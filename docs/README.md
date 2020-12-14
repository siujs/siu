# Overview

`@siujs/cli` is a plug-in front-end application scaffold based on the keynote style of `Monorepo`+`Typescript`, which makes the staff of class library development or multi project development more relaxed and free;

It mainly provides the following commands for the operations involved in the development process of the project:

`siu init...`： Create a `monorepo` style project

`siu create...`： Batch create 'package' or subprojects of `monorepo`

`siu depss...`： Batch `add/remove dev/peer/dependencies` operations for some packages

`siu test...`： Process unit-test、e2e-test of different package

`siu doc...`： Build different 'package' documents

`siu glint...`： Process the verification of 'git' submission specification of the whole team project, and personalized interception processing of other git lifecycle

`siu build...`： Process the code build output of different packages (it can support rollup, webpack4, webpack5, etc.) at the same time

`siu publish...`： to handle different 'package' Publishing processes or other personalization

Except for 'init', other commands fully support plug-in customization;

> `@siujs/cli` was also due to the fact that after using `lerna` for a long time, I found that it did not meet my operational vision well, so I finally decided to build this wheel

## Scaffold design

### Core

Core is the core package of the whole scaffold, which provides plug-in definition API for developers and plug-in calling API for cli users

### CLI

The CLI is a package that directly processes console input and output

### Cmd-\*

CMD - \ \* is the default alternative logic processing for several commands except 'test', and 'doc'. It is equivalent to the logical processing in zero configuration environment;
