const { definePhase, ACTIONS } = require('../../src');

module.exports = definePhase(
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
