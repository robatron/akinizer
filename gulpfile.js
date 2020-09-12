/**
 * This file serves as an end-to-end test for akinizer, in addition to being my
 * personal akinizer definition
 */
const os = require('os');
const path = require('path');
const { exec } = require('shelljs');
const {
    ACTIONS,
    createTaskTree,
    definePackage: p,
    definePhase,
    defineRoot,
    fileExists,
    getConfig,
    isLinux,
    isMac,
} = require('.');

const { binInstallDir, gitCloneDir } = getConfig();
const dotfilesRepoDir = path.join(os.homedir(), '.yadm');
const dotfilesRepoUrl = 'https://robatron@bitbucket.org/robatron/dotfiles.git';
const OMZDir = path.join(os.homedir(), '.oh-my-zsh');
const SpaceshipThemeDir = path.join(OMZDir, 'themes', 'spaceship-prompt');
const powerlineDir = path.join(gitCloneDir, 'powerline');

// Create the full gulp task tree from the phase and pakage definitions and
// export them as gulp tasks
createTaskTree(
    defineRoot([
        definePhase(
            'verifyPrereqsPhase',
            ACTIONS.VERIFY,
            [
                p('curl'),
                p('git'),
                p('node'),
                p('npm'),
                p('nvm', {
                    testFn: (pkg) =>
                        fileExists(
                            path.join(
                                process.env['NVM_DIR'] ||
                                    path.join(
                                        process.env['HOME'],
                                        `.${pkg.name}`,
                                    ),
                                `${pkg.name}.sh`,
                            ),
                        ),
                }),
            ],
            { parallel: true },
        ),
        definePhase('installUtilities', ACTIONS.INSTALL, [
            p('coreutils', {
                // Mac only. Favor GNU utilities over BSD's
                skipAction: !isMac(),
            }),
            p('cowsay'),
            p('fortune-mod', {
                // Linux version of fortune
                skipAction: !isLinux(),
            }),
            p('fortune', {
                // Mac version of fortune
                skipAction: !isMac(),
            }),
            p('gpg'),
            p('gshuf', {
                // Symlink shuf to gshuf on Linux to normalize 'shuffle' command
                // between Linux and Mac
                installCommands: [
                    `mkdir -p $HOME/bin/`,
                    'ln -sf `which shuf` $HOME/bin/gshuf',
                ],
                skipAction: !isLinux(),
            }),
            p('vim'),
        ]),
        definePhase('installPythonPhase', ACTIONS.INSTALL, [
            p('python3'),
            p(
                // Required for installing `pip`. Only needed on Linux
                'python3-distutils',
                {
                    skipAction: !isLinux(),
                    testFn: (pkg) =>
                        !exec(`dpkg -s '${pkg.name}'`, {
                            silent: true,
                        }).code,
                },
            ),
            p('pip', {
                installCommands: [
                    'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
                    'sudo -H python3 /tmp/get-pip.py',
                ],
            }),
            p('pyenv', {
                installCommands: ['curl https://pyenv.run | bash'],
                testFn: (pkg) =>
                    fileExists(
                        path.join(
                            process.env['HOME'],
                            `.${pkg.name}`,
                            'bin',
                            `${pkg.name}`,
                        ),
                    ),
            }),
            p(
                // Required for `yadm`
                'envtpl',
                {
                    installCommands: ['sudo -H pip install envtpl'],
                },
            ),
        ]),
        definePhase('installTerminalPhase', ACTIONS.INSTALL, [
            p('zsh'),
            p('oh-my-zsh', {
                installCommands: [
                    `wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O /tmp/omzshinstall.sh`,
                    `RUNZSH=no sh /tmp/omzshinstall.sh`,
                ],
                testFn: (pkg) => fileExists(OMZDir),
            }),
            p('spaceship-prompt', {
                installCommands: [
                    `git clone https://github.com/denysdovhan/spaceship-prompt.git ${SpaceshipThemeDir}`,
                    `ln -s "${SpaceshipThemeDir}/spaceship.zsh-theme" "${OMZDir}/themes/spaceship.zsh-theme"`,
                ],
                testFn: (pkg) => fileExists(SpaceshipThemeDir),
            }),
            p('powerline', {
                installCommands: [
                    `git clone https://github.com/powerline/fonts.git ${powerlineDir}`,
                    `ls -lah ${powerlineDir}`,

                    // Directory needs to exist and be owned by user to install
                    `mkdir -p $HOME/.local`,
                    `sudo chown -R $USER: $HOME/.local`,
                    `${powerlineDir}/install.sh`,
                ],
                testFn: (pkg) => fileExists(powerlineDir),
            }),

            p('tmux'),
            p('reattach-to-user-namespace', {
                // Mac only. Required for tmux to interface w/ OS X clipboard, etc.
                skipAction: !isMac(),
            }),
        ]),
        definePhase('installDotfilesPhase', ACTIONS.INSTALL, [
            p('yadm', {
                gitPackage: {
                    binSymlink: 'yadm',
                    repoUrl: 'https://github.com/TheLocehiliosan/yadm.git',
                },
            }),
            p('dotfiles', {
                installCommands: [
                    `${path.join(
                        binInstallDir,
                        'yadm',
                    )} clone ${dotfilesRepoUrl}`,
                ],
                // This step requires user interaction (entering a
                // password), so skip it if we're in a continuous-
                // delivery environment (GitHub Actions)
                skipAction: process.env['CI'],
                testFn: (pkg) => fileExists(dotfilesRepoDir),
            }),
        ]),
        definePhase(
            'installMacGuiApps',
            ACTIONS.INSTALL,
            [
                'deluge',
                'google-chrome',
                'iterm2',
                'keepingyouawake',
                'spectacle',
                'visual-studio-code',
            ].map((name) =>
                p(name, {
                    installCommands: [`brew cask install ${name}`],
                    skipAction: !isMac(),
                }),
            ),
        ),
    ]),
    exports,
);
