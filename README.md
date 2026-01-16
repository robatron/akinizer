# Akinizer

![e2e workflow](https://github.com/robatron/akinizer/workflows/E2E%20tests%3A%20Bootstrap%20%2F%20apply/badge.svg)
![unit workflow](https://github.com/robatron/akinizer/workflows/Lint%20%2F%20unit%20test/badge.svg)

> A simple configuration management tool written in JavaScript for fun and practice

## Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

-   [About](#about)
    -   [Why not use Puppet, Chef, Ansible, SaltStack, etc.?](#why-not-use-puppet-chef-ansible-saltstack-etc)
    -   [Supported operating systems](#supported-operating-systems)
    -   [Quick example](#quick-example)
-   [Installing Akinizer](#installing-akinizer)
    -   [Script options](#script-options)
    -   [Package managers](#package-managers)
-   [Using Akinizer](#using-akinizer)
    -   [Examples](#examples)
-   [API](#api)
    -   [`createTaskTree(rootPhase, exp)`](#createtasktreerootphase-exp)
    -   [`definePhase(name, action, targets, phaseOpts)`](#definephasename-action-targets-phaseopts)
    -   [`defineRoot(phases)`](#definerootphases)
    -   [`defineTarget(name, actionArgs)`](#definetargetname-actionargs)
-   [Phase actions](#phase-actions)
    -   [`<All actions>`](#all-actions)
    -   [`EXECUTE_JOBS`](#execute_jobs)
    -   [`INSTALL_PACKAGES`](#install_packages)
    -   [`RUN_PHASES`](#run_phases)
    -   [`VERIFY_PACKAGES`](#verify_packages)
-   [Development](#development)
    -   [Testing](#testing)
    -   [Docker development sandbox](#docker-development-sandbox)
    -   [CI/CD](#cicd)
-   [Learnings](#learnings)
-   [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## About

Akinizer is an [configuration management](https://en.wikipedia.org/wiki/Configuration_management) tool I wrote for managing my preferred programs and configs across different operating systems and machines.

### Why not use [Puppet](https://puppet.com/), [Chef](https://www.chef.io/), [Ansible](https://www.ansible.com/), [SaltStack](https://www.saltstack.com/), etc.?

I created Akinizer for fun, practice, and to learn more about [operating system configuration management](https://en.wikipedia.org/wiki/Configuration_management#Operating_System_configuration_management). Why use high-quality robust software when I could write my own janky tool in JavaScript? 😉

### Supported operating systems

Akinizer supports the following operating systems (but it would probably work on other versions of macOS and Debian-based Linux distros):

-   **Linux** - Ubuntu 18.04, 20.04
-   **Mac** - macOS 10.15, 11.0

OS support is verified via end-to-end tests. See the [CI/CD](#cicd) section for details.

### Quick example

Here's a simple example of what an Akinizer config looks like. See [Using Akinizer](#using-akinizer) for more details.

```js
const {
    ACTIONS,
    createTaskTree,
    definePhase,
    defineRoot,
} = require('akinizer');

createTaskTree(
    defineRoot([
        // Make sure `cowsay`, `htop`, and `vim` are installed
        definePhase('installUtilsPhase', ACTIONS.INSTALL_PACKAGES, [
            'cowsay',
            'htop',
            'vim',
        ]),
    ]),
    exports,
);
```

Here's a sample output for when it's applied:

```log
[15:20:41] Starting 'default'...

[15:20:41] Starting 'installUtilsPhase:cowsay'...
info: Checking if target package 'cowsay' is installed...
info: Verifying target 'cowsay' exists with `brew list --versions 'cowsay'`...'
cowsay 3.04
info: Target package 'cowsay' is already installed. Moving on...
[15:20:44] Finished 'installUtilsPhase:cowsay' after 2.83 s

...

[15:20:47] Finished 'default' after 5.85 s
```

## Installing Akinizer

To install or update Akinizer, you should run the [bootstrap.sh script](./bootstrap.sh) which assures required programs are installed (e.g., `git`, `node.js`), downloads or updates Akinizer, and installs its dependencies. Review the script, then either download and run the script manually, or use the following cURL or Wget commands:

```sh
curl -fsSL https://raw.githubusercontent.com/robatron/akinizer/master/bootstrap.sh \
    -o /tmp/akinizer-bootstrap.sh && \
    bash /tmp/akinizer-bootstrap.sh
```

```sh
wget -qO /tmp/akinizer-bootstrap.sh \
    https://raw.githubusercontent.com/robatron/akinizer/master/bootstrap.sh && \
    bash /tmp/akinizer-bootstrap.sh
```

### Script options

The bootstrap script's behavior can be modified with the following environment variables:

-   `AK_GIT_REF` - The Akinizer repo ref to checkout (default: `master`)
-   `AK_INSTALL_ROOT` - Where to clone the Akinizer repo to (default: `$HOME/opt/akinizer`)
-   `AK_SKIP_CLONE` - Skip the Akinizer clone step (default: `no`)

For example, the following would change the Akinizer installation directory to `/opt` with the `AK_INSTALL_ROOT` option:

```sh
curl -o- https://raw.githubusercontent.com/robatron/akinizer/master/bootstrap.sh | AK_INSTALL_ROOT=/opt bash
```

### Package managers

By default, Akinizer uses the following package management tools to verify and install programs:

-   [apt](<https://en.wikipedia.org/wiki/APT_(software)>) and [dpkg](https://en.wikipedia.org/wiki/Dpkg) on Linux
-   [Homebrew](<https://en.wikipedia.org/wiki/Homebrew_(package_manager)>) and [Cask](https://github.com/Homebrew/homebrew-cask) on Mac

Apt and dpkg must be pre-installed on the Linux system, but Homebrew and Cask can be installed via the bootstrap script on Mac.

## Using Akinizer

Akinizer's system configuration is declared as a tree of **phases**, each of which contains a list of **targets** and an **action** to apply to them. Akinizer converts the phase tree into a hierarchy of runnable [gulp](https://gulpjs.com/) tasks.

### Examples

**ℹ️ For a full annotated working example, see [examples/gulpfile.js](./examples/gulpfile.js)**

The following is a simple example that assures a list of utilities are installed on the system.

```js
// ./examples/simple/gulpfile.js
const {
    ACTIONS,
    createTaskTree,
    definePhase,
    defineRoot,
} = require('akinizer');

// Create the phase tree and export a hierarchy of runnable gulp tasks, one for
// each package and phase.
createTaskTree(
    defineRoot([
        definePhase('installUtilsPhase', ACTIONS.INSTALL_PACKAGES, [
            'cowsay',
            'gpg',
            'htop',
            'jq',
            'vim',
        ]),
    ]),
    exports,
);
```

Run `gulp` to execute the default task which refers to Akinizer's root phase:

```log
[I] ➜ gulp

[15:20:41] Using gulpfile ~/code/akinizer/examples/simple/gulpfile.js
[15:20:41] Starting 'default'...

[15:20:41] Starting 'installUtilsPhase:cowsay'...
info: Checking if target package 'cowsay' is installed...
info: Verifying target 'cowsay' exists with `brew list --versions 'cowsay'`...'
cowsay 3.04
info: Target package 'cowsay' is already installed. Moving on...
[15:20:44] Finished 'installUtilsPhase:cowsay' after 2.83 s

...

[15:20:46] Starting 'installUtilsPhase:vim'...
info: Checking if target package 'vim' is installed...
info: Verifying target 'vim' exists with `brew list --versions 'vim'`...'
vim 8.2.1500
info: Target package 'vim' is already installed. Moving on...
[15:20:47] Finished 'installUtilsPhase:vim' after 753 ms

[15:20:47] Finished 'default' after 5.85 s
```

You can also run each phase and task individually:

```log
[I] ➜ gulp installUtilsPhase:vim

[15:26:56] Using gulpfile ~/code/akinizer/examples/simple/gulpfile.js
[15:26:56] Starting 'installUtilsPhase:vim'...
info: Checking if target package 'vim' is installed...
info: Verifying target 'vim' exists with `brew list --versions 'vim'`...'
vim 8.2.1500
info: Target package 'vim' is already installed. Moving on...
[15:26:57] Finished 'installUtilsPhase:vim' after 835 ms
```

You can list all available tasks with `gulp --tasks`:

```log
[I] ➜ gulp --tasks

[15:27:34] Tasks for ~/code/akinizer/examples/simple/gulpfile.js
[15:27:34] ├── installUtilsPhase:cowsay
[15:27:34] ├── installUtilsPhase:gpg
[15:27:34] ├── installUtilsPhase:htop
[15:27:34] ├── installUtilsPhase:jq
[15:27:34] ├── installUtilsPhase:vim
[15:27:34] ├─┬ installUtilsPhase
[15:27:34] │ └─┬ <series>
[15:27:34] │   ├── installUtilsPhase:cowsay
[15:27:34] │   ├── installUtilsPhase:gpg
[15:27:34] │   ├── installUtilsPhase:htop
[15:27:34] │   ├── installUtilsPhase:jq
[15:27:34] │   └── installUtilsPhase:vim
[15:27:34] └─┬ default
[15:27:34]   └─┬ <series>
[15:27:34]     └─┬ <series>
[15:27:34]       ├── installUtilsPhase:cowsay
[15:27:34]       ├── installUtilsPhase:gpg
[15:27:34]       ├── installUtilsPhase:htop
[15:27:34]       ├── installUtilsPhase:jq
[15:27:34]       └── installUtilsPhase:vim
```

## API

### `createTaskTree(rootPhase, exp)`

Top-level function to create the entire phase task tree. This should be the final function call of your `gulpfile.js` file.

Parameters:

-   **`rootPhase`** - The output of `defineRoot()`, the root of the phase tree
-   **`exp`** - The module's `exports` object, onto which the gulp tasks are attached so they can be runnable

Example:

```js
createTaskTree(
    defineRoot([
        /* ... phases ... */
    ]),
    exports,
);
```

### `definePhase(name, action, targets, phaseOpts)`

Define a phase in which targets have an action applied to them, e.g., to assure a set of packages are installed.

-   **`name`** - Name of the phase
-   **`action`** - Action to apply to the list of targets. See [Phase actions](#phase-actions) for details.
-   **`targets`** - A list of targets which can be strings or the outputs of `defineTarget()`
-   **`phaseOpts`** - Phase options
    -   **`phaseOpts.parallel`** - Process targets in parallel
    -   **`phaseOpts.targetOpts`** - Options to apply to all targets

Example:

```js
definePhase(
    'installUtilsPhase',
    ACTIONS.INSTALL_PACKAGES,
    [
        // Simple targets without arguments
        'cowsay',
        'gpg',
        'htop',

        // Targets defined with `defineTarget()`
        defineTarget('python3-distutils', {
            skipAction: () => !isLinux(),
        }),
        defineTarget('pip', {
            actionCommands: [
                'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
                'sudo -H python3 /tmp/get-pip.py',
            ],
        }),
    ],

    // phaseOpts
    {
        targetOpts: {
            forceAction: true,
        },
        parallel: true,
    },
);
```

### `defineRoot(phases)`

Defines the root phase. It takes only one argument, a list of `phases` defined by `definePhase()`.

Example:

```js
defineRoot([
    definePhase('phase1' /* ... */),
    definePhase('phase2' /* ... */),
    // ... more phases ...
]);
```

### `defineTarget(name, actionArgs)`

Define a target and its action arguments. See "Phase actions" section below for details about how actions work.

-   **`name`** - Name or identifier of target, depending on its phase's _action_
-   **`actionArgs`** - Arguments for this target's phase's _action_

Examples:

```js
defineTarget('python3');

defineTarget('python3-distutils', {
    skipAction: () => !isLinux(),
});

defineTarget('pip', {
    actionCommands: [
        'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
        'sudo -H python3 /tmp/get-pip.py',
    ],
});

defineTarget('pyenv', {
    actionCommands: ['curl https://pyenv.run | bash'],
    skipAction: () => fileExists(pyenvDir),
    skipActionMessage: () => `File exists: ${pyenvDir}`,
});
```

## Phase actions

_Actions_, defined in [`definePhase()`](#definephasename-action-targets-phaseopts), are verbs that will be applied to all targets of a phase. Actions treat _targets_ differently, e.g. as _jobs_, _packages_, or _phases_, and take arguments defined in `defineTarget()` or `phaseOpts`. Supported actions and their arguments are listed below.

### `<All actions>`

All actions support the following function arguments, all of which will be provided with the `target` when they're evaluated.

-   **`forceAction: function(target: Target): string`** - (Optional) If this function is provided, always run the action if this evaluates to `true`
-   **`skipAction: function(target: Target): string`** - (Optional) If this function is provided, always skip the action if this evaluates to `true`
-   **`skipActionMessage: function(target: Target): string`** - (Optional) A function that return a message to explain why the action was skipped

### `EXECUTE_JOBS`

Executes arbitrary shell code. Required arguments:

-   **`actionCommands: string[]`** - Shell commands to execute

### `INSTALL_PACKAGES`

Installs a target package using the system package manager by default. Supported arguments:

-   **`actionCommands: string[]`** - Shell commands to execute
-   **`gitPackage: object`** - Marks this target as a "git package"
    -   **`gitPackage.repoUrl: string`** - URL (HTTPS) to the git repo of the target package
    -   **`gitPackage.symlink: string`** - (Optional) File to symlink from the repo after its cloned. Default: target name
    -   **`gitPackage.binDir: string`** - (Optional) Symlink target directory. Default: `$HOME/bin`
    -   **`gitPackage.cloneDir: string`** - (Optional) Clone target directory. Default: `$HOME/opt`
-   **`postInstall: function(target: Target): void`** - (Optional) Function that's called with the `target` after installation is complete.
-   **`verifyCommandExists`** - Verify the target name exists as a command as oppose to verifying the target is installed via the system target manager

Example:

```js
definePhase('installTerm', ACTIONS.INSTALL_PACKAGES, [
    defineTarget('zsh'),
    defineTarget('oh-my-zsh', {
        actionCommands: [
            `curl https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -o /tmp/omzshinstall.sh`,
            `RUNZSH=no sh /tmp/omzshinstall.sh`,
        ],
        skipAction: () => fileExists(OMZDir),
        skipActionMessage: () => `File exists: ${OMZDir}`,
    }),
    defineTarget('spaceship-prompt', {
        gitPackage: {
            binDir: `${OMZDir}/themes/spaceship.zsh-theme`,
            binSymlink: 'spaceship.zsh-theme',
            cloneDir: SpaceshipThemeDir,
            ref: 'c38183d654c978220ddf123c9bdb8e0d3ff7e455',
            repoUrl: 'https://github.com/denysdovhan/spaceship-prompt.git',
        },
        skipAction: () => fileExists(SpaceshipThemeDir),
        skipActionMessage: () => `File exists: ${SpaceshipThemeDir}`,
    }),
]);
```

### `RUN_PHASES`

Runs nested phases. Example:

```js
// Targets are other phases
definePhase('installUtils', ACTIONS.RUN_PHASES, [
    // Common phase (install on all systems)
    definePhase('common', ACTIONS.INSTALL_PACKAGES, ['cowsay', 'gpg', 'htop']),

    // Linux phase (install only on Linux)
    isLinux() &&
        definePhase('linux', ACTIONS.INSTALL_PACKAGES, ['fortune-mod']),

    // Mac phase (install only on Mac)
    isMac() && definePhase('mac', ACTIONS.INSTALL_PACKAGES, ['fortune']),
]);
```

### `VERIFY_PACKAGES`

Verifies packages are installed. Supported arguments:

-   **`verifyCommandExists`** - Verify the target name exists as a command as oppose to verifying the target is installed via the system target manager

Example:

```js
definePhase(
    'verifyPrereqs',
    ACTIONS.VERIFY_PACKAGES,
    ['curl', 'git', 'node', 'npm'],
    {
        // Apply these options to all of this phase's packages
        targetOpts: {
            // This option verifies the command exists instead of verifying
            // its target exists with the system target manager
            verifyCommandExists: true,
        },

        // We can run the phase in parallel b/c target verifications are
        // independent from each other
        parallel: true,
    },
);
```

## Development

Here are some notes about how to develop Akinizer.

### Testing

Akinizer was mostly developed against unit tests, which are run with [jest](https://jestjs.io/). To run the full suite of tests:

```sh
npm test
```

Or run the tests and watch for changes:

```sh
npm run watch
```

### Docker development sandbox

Sometimes it's necessary to run the entire system end-to-end. To protect your machine from inadvertent system-wide changes during e2e development, Akinizer provides a Docker container to create and run a repeatable, isolated development sandbox. To use it, first build the image from the [./Dockerfile](./Dockerfile):

```sh
npm run build
```

Then run it:

```sh
npm start
```

The repo will be mounted inside of the container. Play around as much as you want. All changes will be reverted when the container is restarted.

### CI/CD

End-to-end and unit tests are run automatically via [GitHub Actions](https://github.com/features/actions) when updates are pushed to the repo. These tests are configured in the `.github/workflows/*.yml` files.

# Learnings

Here are a few noteable technologies and concepts I learned, and/or practiced to create this project.

-   [GitHub Actions](https://github.com/features/actions) is used as the CI/CD pipeline technology to run end-to-end and unit tests against a matrix of operating systems and scenarios.
    -   It supports Ubuntu and macOS, Akinizer's target operating systems
    -   It's free within [generous limits](https://docs.github.com/en/free-pro-team@latest/actions/reference/usage-limits-billing-and-administration#usage-limits)!
    -   See the `*.yml` files in [.github/workflows/]()
-   [Docker](https://www.docker.com/) is used as a local development sandbox, ideal for testing configuration management stuff!
    -   See [Dockerfile]() for details
-   [Jest snapshot testing](https://jestjs.io/docs/en/snapshot-testing) is used to quickly test complex task trees and other objects outside of a [React](https://reactjs.org/)/UI testing context.
    -   [Inline snapshots](https://jestjs.io/docs/en/snapshot-testing#inline-snapshots) are used to test smaller objects alongside `expect` statements
    -   [`.toThrowErrorMatchingInlineSnapshots`](https://jestjs.io/docs/en/expect#tothrowerrormatchinginlinesnapshotinlinesnapshot) is used to easily test error messages
-   Semi-[declarative programming](https://en.wikipedia.org/wiki/Declarative_programming) pattern is used to define task and phase trees.
    -   See [examples/gulpfile.js]() for an example.
-   The [simple-git](https://github.com/steveukx/git-js#readme) library is used for interacting with git repos
    -   The [nodegit](https://www.nodegit.org/) library is powerful, but turned out to be too low-level and complex for this project
-   [Node-config](https://github.com/lorenwest/node-config) is used to enable Akinizer configuration via config files. See [examples/.akinizerrc.js]() for an example.
-   The [Connonical way](https://prettier.io/docs/en/integrating-with-linters.html) to combine [Prettier](https://prettier.io/) and [Eslint](https://eslint.org/) is used to enable seamless linting and formatting
-   [DocToc](https://github.com/thlorenz/doctoc) is used to maintain the README table of contents.

# License

[MIT](./LICENSE)
