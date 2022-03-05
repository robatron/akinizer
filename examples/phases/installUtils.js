const path = require('path');
const { homedir } = require('os');
const {
    ACTIONS,
    definePhase,
    defineTarget: t,
    fileExists,
    isLinux,
    isMac,
} = require('../../src');

const GSHUFF_PATH = path.join(homedir(), 'bin', 'gshuf');

module.exports = definePhase('installUtils', ACTIONS.RUN_PHASES, [
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
                    `ln -sf \`which shuf\` ${GSHUFF_PATH}`,
                ],
                skipAction: () => fileExists(GSHUFF_PATH),
                skipActionMessage: () => `File already exists: ${GSHUFF_PATH}`,
            }),
        ]),
    isMac() &&
        definePhase('mac', ACTIONS.INSTALL_PACKAGES, [
            // Favor GNU utilities over BSD's
            'coreutils',
            'fortune',
        ]),
]);
