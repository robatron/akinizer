const { userInfo } = require('os');
const { exec } = require('shelljs');
const {
    ACTIONS,
    definePhase,
    defineTarget: t,
    isLinux,
    isMac,
} = require('../../src');

module.exports = definePhase('installDocker', ACTIONS.RUN_PHASES, [
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
