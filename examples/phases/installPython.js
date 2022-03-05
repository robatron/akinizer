const { homedir } = require('os');
const path = require('path');
const {
    ACTIONS,
    definePhase,
    defineTarget: t,
    fileExists,
    isLinux,
} = require('../../src');

const PYENV_DIR = path.join(homedir(), `.pyenv`);

module.exports = definePhase('installPython', ACTIONS.RUN_PHASES, [
    definePhase('base', ACTIONS.INSTALL_PACKAGES, [
        t('python3'),
        t('pyenv', {
            actionCommands: ['curl https://pyenv.run | bash'],
            skipAction: () => fileExists(PYENV_DIR),
            skipActionMessage: () => `File exists: ${PYENV_DIR}`,
        }),
    ]),

    // Pip is included with python on Mac, but needs to be installed separately
    // on Linux. See https://docs.brew.sh/Homebrew-and-Python
    isLinux() &&
        definePhase('linux', ACTIONS.INSTALL_PACKAGES, [
            t('python3-distutils'),
            t('pip-linux', {
                actionCommands: [
                    'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
                    'sudo -H python3 /tmp/get-pip.py',
                ],
            }),
        ]),
]);
