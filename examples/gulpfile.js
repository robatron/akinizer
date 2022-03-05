// This is a working example of an Akinizer configuration. It also serves as an
// end-to-end test, in addition to being my personal Akinizer config ;-)
const { createTaskTree, defineRoot } = require('..');

// Create the default task tree from the phase and package definitions and
// export them as gulp tasks
createTaskTree(
    defineRoot([
        require('./phases/updateApt'),
        require('./phases/verifyPrereqs'),
        require('./phases/installUtils'),
        require('./phases/installPython'),
        require('./phases/installTerm'),
        require('./phases/installDotfiles'),
        require('./phases/installDocker'),
        // require('./phases/installGUIApps')
    ]),
    exports,
);
