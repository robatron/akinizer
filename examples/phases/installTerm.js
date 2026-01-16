const path = require('path');
const { homedir } = require('os');
const { exec } = require('shelljs');
const {
    ACTIONS,
    definePhase,
    defineTarget: t,
    getConfig,
    fileExists,
} = require('../../src');

// Grab optional configuration from the `.akinizerrc.js` file
const { gitCloneDir } = getConfig();

const OMZ_DIR = path.join(homedir(), '.oh-my-zsh');
const SPACESHIP_THEME_DIR = path.join(OMZ_DIR, 'themes', 'spaceship-prompt');
const POWERLINE_DIR = path.join(gitCloneDir, 'powerline');

module.exports = definePhase('installTerm', ACTIONS.INSTALL_PACKAGES, [
    t('zsh'),
    t('oh-my-zsh', {
        actionCommands: [
            // Download the install script first so we can pass the RUNZSH=no
            // flag to disable interactive prompt (which blocks script)
            `curl https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -o /tmp/omzshinstall.sh`,
            `RUNZSH=no sh /tmp/omzshinstall.sh`,
        ],
        skipAction: () => fileExists(OMZ_DIR),
        skipActionMessage: () => `File exists: ${OMZ_DIR}`,
    }),
    t('spaceship-prompt', {
        gitPackage: {
            binDir: `${OMZ_DIR}/themes/`,
            binSymlink: 'spaceship.zsh-theme',
            cloneDir: SPACESHIP_THEME_DIR,
            ref: 'e498b1381df3a122af107b61f5cc8f3ced93ee69',
            repoUrl: 'https://github.com/denysdovhan/spaceship-prompt.git',
        },
        skipAction: () => fileExists(SPACESHIP_THEME_DIR),
        skipActionMessage: () => `File exists: ${SPACESHIP_THEME_DIR}`,
    }),
    t('powerline', {
        gitPackage: {
            cloneDir: POWERLINE_DIR,
            ref: 'a029626780dd4af32f15a3e708a5b00528c22f1d',
            repoUrl: 'https://github.com/powerline/fonts.git',
        },
        postInstall: () => {
            const cmds = [
                `mkdir -p $HOME/.local`,
                `sudo chown -R $USER: $HOME/.local`,
                `${POWERLINE_DIR}/install.sh`,
            ].join(' && ');

            const err = exec(cmds).code;

            if (err) {
                throw new Error(`Post-install commands failed: ${cmds}`);
            }
        },
        skipAction: () => fileExists(POWERLINE_DIR),
        skipActionMessage: () => `File exists: ${POWERLINE_DIR}`,
    }),

    // t('tmux'),
    // t('reattach-to-user-namespace', {
    //     // Mac only. Required for tmux to interface w/ OS X clipboard, etc.
    //     skipAction: () => !isMac(),
    // }),
]);
