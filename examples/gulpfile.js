/**
 * This is a working example of an Akinizer configuration. It also serves as an
 * end-to-end test, in addition to being my personal Akinizer config ;-)
 */
const { homedir, userInfo } = require('os');
const path = require('path');
const { exec } = require('shelljs');
const {
    ACTIONS,
    createTaskTree,
    defineTarget: t,
    definePhase,
    defineRoot,
    getConfig,
    fileExists,
    isLinux,
    isMac,
} = require('..');

// Grab optional configuration from the `.akinizerrc.js` file
const { binInstallDir, gitCloneDir } = getConfig();

// Define phases. In this phase, we're verifying packages are installed.
const verifyPrereqsPhase = definePhase(
    // Phase name. This can be run with `gulp verifyPrereqs`
    'verifyPrereqs',

    // For every target, apply the `VERIFY_PACKAGES` action
    ACTIONS.VERIFY_PACKAGES,

    // List of packages to be verified
    ['curl', 'git', 'node', 'npm'],

    {
        // Apply these options to all of this phase's packages
        targetOpts: {
            // This option verifies the command exists instead of verifying
            // its target exists with the system package manager
            verifyCommandExists: true,
        },

        // We can run the phase in parallel b/c target verifications are
        // independent from each other
        parallel: true,
    },
);

// Make sure apt is up-to-date on Linux
const updateApt = definePhase('updateApt', ACTIONS.EXECUTE_JOBS, [
    t('apt-update', {
        actionCommands: ['sudo apt update'],
        skipAction: () => !isLinux(),
    }),
]);

const gshufPath = path.join(homedir(), 'bin', 'gshuf');
const installUtilsPhase = definePhase('installUtils', ACTIONS.RUN_PHASES, [
    definePhase('common', ACTIONS.INSTALL_PACKAGES, [
        'cowsay',
        'gpg',
        'htop',
        'jq',
        'vim',

        // Getting nvm to work in all contexts (e.g., in the vscode debugger or
        // within vscode extensions) is a giant pain, so let's install node.js
        // at the system level as a fallback.
        'nodejs',
    ]),
    isLinux() &&
        definePhase('linux', ACTIONS.INSTALL_PACKAGES, [
            // Linux version of fortune
            t('fortune-mod'),

            // Symlink shuf to gshuf on Linux to normalize 'shuffle' command
            // between Linux and Mac
            t('gshuf', {
                actionCommands: [
                    `mkdir -p $HOME/bin/`,
                    `ln -sf \`which shuf\` ${gshufPath}`,
                ],
                skipAction: () => fileExists(gshufPath),
                skipActionMessage: () => `File already exists: ${gshufPath}`,
            }),
        ]),
    isMac() &&
        definePhase('mac', ACTIONS.INSTALL_PACKAGES, [
            // Favor GNU utilities over BSD's
            'coreutils',
            'fortune',
        ]),
]);

const pyenvDir = path.join(homedir(), `.pyenv`);
const installPythonPhase = definePhase(
    'installPython',
    ACTIONS.INSTALL_PACKAGES,
    [
        t('python3'),

        // Required for installing `pip` on Linux
        t('python3-distutils', { skipAction: () => !isLinux() }),

        // Pip is included with python on Mac, but needs to be installed
        // separately on Linux. See https://docs.brew.sh/Homebrew-and-Python
        !isLinux &&
            t('pip-linux', {
                actionCommands: [
                    'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
                    'sudo -H python3 /tmp/get-pip.py',
                ],
            }),

        t('pyenv', {
            actionCommands: ['curl https://pyenv.run | bash'],
            skipAction: () => fileExists(pyenvDir),
            skipActionMessage: () => `File exists: ${pyenvDir}`,
        }),

        // Required for `yadm`
        t('envtpl', {
            actionCommands: isMac()
                ? ['$(brew --prefix)/opt/python/libexec/bin/pip install envtpl']
                : ['sudo -H pip install envtpl'],
        }),
    ],
);

const OMZDir = path.join(homedir(), '.oh-my-zsh');
const SpaceshipThemeDir = path.join(OMZDir, 'themes', 'spaceship-prompt');
const powerlineDir = path.join(gitCloneDir, 'powerline');
const installTermPhase = definePhase('installTerm', ACTIONS.INSTALL_PACKAGES, [
    t('zsh'),
    t('oh-my-zsh', {
        actionCommands: [
            `curl https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -o /tmp/omzshinstall.sh`,
            `RUNZSH=no sh /tmp/omzshinstall.sh`,
        ],
        skipAction: () => fileExists(OMZDir),
        skipActionMessage: () => `File exists: ${OMZDir}`,
    }),
    t('spaceship-prompt', {
        gitPackage: {
            binDir: `${OMZDir}/themes/`,
            binSymlink: 'spaceship.zsh-theme',
            cloneDir: SpaceshipThemeDir,
            ref: 'c38183d654c978220ddf123c9bdb8e0d3ff7e455',
            repoUrl: 'https://github.com/denysdovhan/spaceship-prompt.git',
        },
        skipAction: () => fileExists(SpaceshipThemeDir),
        skipActionMessage: () => `File exists: ${SpaceshipThemeDir}`,
    }),
    t('powerline', {
        gitPackage: {
            cloneDir: powerlineDir,
            ref: 'e80e3eba9091dac0655a0a77472e10f53e754bb0',
            repoUrl: 'https://github.com/powerline/fonts.git',
        },
        postInstall: () => {
            const cmds = [
                `mkdir -p $HOME/.local`,
                `sudo chown -R $USER: $HOME/.local`,
                `${powerlineDir}/install.sh`,
            ].join(' && ');

            const err = exec(cmds).code;

            if (err) {
                throw new Error(`Post-install commands failed: ${cmds}`);
            }
        },
        skipAction: () => fileExists(powerlineDir),
        skipActionMessage: () => `File exists: ${powerlineDir}`,
    }),

    t('tmux'),
    t('reattach-to-user-namespace', {
        // Mac only. Required for tmux to interface w/ OS X clipboard, etc.
        skipAction: () => !isMac(),
    }),
]);

const installMacGuiAppsPhase =
    isMac() &&
    definePhase(
        'installMacGuiApps',
        ACTIONS.INSTALL_PACKAGES,
        [
            'deluge',
            'google-chrome',
            'homebrew/cask-drivers/logitech-options',
            'iterm2',
            'keepingyouawake',
            'spectacle',
            'visual-studio-code',
        ],
        { targetOpts: { isGUI: true } },
    );

const installDockerPhase = definePhase('installDocker', ACTIONS.RUN_PHASES, [
    // Install Docker for Linux
    isLinux() &&
        definePhase('linux', ACTIONS.RUN_PHASES, [
            definePhase('prereqs', ACTIONS.INSTALL_PACKAGES, [
                t('apt-transport-https'),
                t('ca-certificates'),
                t('gnupg-agent'),
                t('software-properties-common'),
                t('docker-apt-key', {
                    actionCommands: [
                        `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -`,
                        `sudo add-apt-repository \
                                "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
                                $(lsb_release -cs) \
                                stable"`,
                        'sudo apt update',
                    ],
                    forceAction: () => true,
                }),
            ]),

            // Install engine in separate phase b/c it's apt-based
            definePhase('engine', ACTIONS.INSTALL_PACKAGES, [
                'docker-ce',
                'docker-ce-cli',
                'containerd.io',
            ]),

            // Allow docker to be managed without `sudo`. Only relevant for Linux. See
            // https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user
            definePhase('configureDockerRootlessMode', ACTIONS.EXECUTE_JOBS, [
                t('add-docker-group', {
                    actionCommands: ['sudo groupadd docker'],
                    skipAction: () => {
                        const groups = exec('getent group', { silent: true })
                            .stdout.split('\n')
                            .map((group) => group.split(':')[0]);
                        return groups.includes('docker');
                    },
                    skipActionMessage: () =>
                        'Docker group already exists on system',
                }),
                t('add-group-membership', {
                    actionCommands: [
                        `sudo usermod -aG docker ${userInfo().username}`,
                    ],
                    skipAction: () => {
                        // Does the user belong to the docker group?
                        const groups = exec('groups', { silent: true }).stdout;
                        return /\bdocker\b/gi.test(groups);
                    },
                    skipActionMessage: () =>
                        `User '${
                            userInfo().username
                        }' already belongs to 'docker' group`,
                }),
            ]),

            // Verify we can run Docker without `sudo`, but move on if we can't
            definePhase('verifyDocker', ACTIONS.EXECUTE_JOBS, [
                t('rootless-docker', {
                    actionCommands: ['docker run hello-world'],
                    dieOnFail: false,
                }),
            ]),
        ]),

    // Install Docker for Mac. We can't configure or verify it since its a
    // GUI app, so installation is much simpler than for Linux.
    isMac() &&
        definePhase('mac', ACTIONS.INSTALL_PACKAGES, [
            t('docker', { isGUI: true }),
        ]),
]);

const dotfilesRepoDir = path.join(homedir(), '.yadm');
const dotfilesRepoUrl = 'https://robatron@bitbucket.org/robatron/dotfiles.git';
const installDotfilesPhase = definePhase(
    'installDotfiles',
    ACTIONS.INSTALL_PACKAGES,
    [
        t('yadm', {
            gitPackage: {
                binSymlink: 'yadm',
                ref: '7628a1b61d8fc21c899c8f8f0fef8c95725598dd',
                repoUrl: 'https://github.com/TheLocehiliosan/yadm.git',
            },
        }),
        t('dotfiles', {
            actionCommands: [
                `${path.join(binInstallDir, 'yadm')} clone ${dotfilesRepoUrl}`,
            ],
            skipAction: () =>
                // This step requires user interaction (entering a password), so skip
                // it if we're in a continuous-delivery environment (GitHub Actions)
                process.env['CI'] || fileExists(dotfilesRepoDir),
            skipActionMessage: () => {
                if (process.env['CI']) {
                    return 'In non-interactive environment';
                } else if (fileExists) {
                    return 'File exists: ' + dotfilesRepoDir;
                }
                return 'Unknown reason';
            },
        }),
    ],
);

// Create the full gulp task tree from the phase and pakage definitions and
// export them as gulp tasks
createTaskTree(
    // Define the task tree root consisting of phases
    defineRoot([
        updateApt,
        verifyPrereqsPhase,
        installUtilsPhase,
        installPythonPhase,
        installTermPhase,
        installMacGuiAppsPhase,
        installDockerPhase,
        installDotfilesPhase,
    ]),
    exports,
);
