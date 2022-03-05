const { ACTIONS, PHASE_NAME_DEFAULT } = require('./constants');

// Helper function to create a phase definition
const definePhase = (name, action, targets, phaseOpts = {}) => [
    name,
    {
        ...phaseOpts,
        action,
        targets: targets.filter((target) => target),
    },
];

// Helper function to create the root phase definition with required parameters
// and structure.
const defineRoot = (
    targets,
    parallel = false,
    phaseName = PHASE_NAME_DEFAULT,
) => [
    definePhase(phaseName, ACTIONS.RUN_PHASES, targets, {
        parallel,
    }),
];

// Helper function to create a target definition
const defineTarget = (name, actionArgs = {}) => [name, actionArgs];

module.exports = {
    definePhase,
    defineRoot,
    defineTarget,
};
