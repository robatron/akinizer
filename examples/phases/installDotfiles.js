const { homedir } = require('os');
const {
    ACTIONS,
    definePhase,
    defineTarget: t,
    fileExists,
} = require('../../src');

const dotfilesRepoDir = `${homedir()}/.local/share/yadm/repo.git/`;
const yadmBin = 'yadm';
const dotfilesRepoUrl = 'https://git@github.com/robatron/dotfiles.git';
const dotfilesRepoUrlSSH = 'git@github.com:robatron/dotfiles.git';

module.exports = definePhase('installDotfiles', ACTIONS.RUN_PHASES, [
    definePhase('installYadm', ACTIONS.INSTALL_PACKAGES, ['gpg', 'yadm']),
    !fileExists(dotfilesRepoDir) &&
        definePhase(
            'installDotfiles',
            ACTIONS.EXECUTE_JOBS,
            [
                // Shim the git config to suppress defaultBranch warning
                // from GitHub until the real config can be rendered
                t('shimGitConfig', {
                    actionCommands: [
                        'git config --global init.defaultBranch master',
                    ],
                }),

                // Clone the actual dotfiles
                t('clone', {
                    actionCommands: [
                        `echo "👉👉👉 See ${dotfilesRepoUrl} for additional instructions"`,
                        `${yadmBin} clone ${dotfilesRepoUrl}`,
                    ],
                }),

                // Swap the https url for SSH
                t('configure', {
                    actionCommands: [
                        `${yadmBin} remote set-url origin ${dotfilesRepoUrlSSH}`,
                    ],
                }),
            ],
            {
                targetOpts: {
                    // These steps require user interaction (entering a
                    // password), so skip it if we're in a continuous-
                    // delivery environment (GitHub Actions)
                    skipAction: () => process.env['CI'],
                    skipActionMessage: () => 'In CI/CD environment',
                },
            },
        ),
]);
