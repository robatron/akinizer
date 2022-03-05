const { ACTIONS, definePhase, defineTarget: t, isLinux } = require('../../src');

// Make sure apt is up-to-date on Linux
module.exports =
    isLinux() &&
    definePhase('linux:updateApt', ACTIONS.EXECUTE_JOBS, [
        t('aptUpdate', {
            actionCommands: ['sudo apt update'],
        }),
    ]);
