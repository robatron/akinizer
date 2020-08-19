const gulp = require('gulp');
const {
    ACTIONS,
    createPhaseDef,
    createPhaseTreeDef,
    createPhaseTreeTasks,
} = require('../index');

jest.mock('gulp');

/**
 * defaultTestPhaseTreeDef is a definition of a phase tree exemplifying
 * thefollowing features:
 *
 * Phase actions:
 *  - INSTALL
 *  - VERIFY
 *  - RUN_PHASES
 *
 * Phase async:
 *  - parallel
 *  - series (default)
 */

const defaultTestPhaseTreeDef = createPhaseTreeDef([
    createPhaseDef('installPhase', ACTIONS.INSTALL, [
        'alpha',
        'bravo',
        'charlie',
    ]),
    createPhaseDef('runPhase', ACTIONS.RUN_PHASES, [
        createPhaseDef('subInstallPhase', ACTIONS.INSTALL, [
            'delta',
            'echo',
            'foxtrot',
        ]),
        createPhaseDef('subRunPhase', ACTIONS.RUN_PHASES, [
            createPhaseDef('subSubInstallPhase', ACTIONS.INSTALL, [
                'golf',
                'hotel',
                'india',
            ]),
            createPhaseDef('subSubVerifyPhase', ACTIONS.VERIFY, [
                'juliett',
                'kelo',
                'lima',
            ]),
        ]),
        createPhaseDef('subVerifyPhase', ACTIONS.VERIFY, [
            'mike',
            'november',
            'oscar',
        ]),
    ]),
    createPhaseDef(
        'verifyPhase',
        ACTIONS.VERIFY,
        ['papa', 'quebec', 'romeo', 'sierra'],
        {
            parallel: true,
        },
    ),
]);

describe('createPhaseTreeTasks', () => {
    beforeEach(() => {
        ['parallel', 'series'].forEach((asyncType) => {
            gulp[asyncType] = jest.fn((tasks) => {
                return {
                    asyncType,
                    displayName: null,
                    tasks: tasks.map((task) =>
                        typeof task === 'function' ? 'task-fn' : task,
                    ),
                };
            });
        });
    });

    it('builds a task tree from definition', () => {
        const testExports = {};
        createPhaseTreeTasks(defaultTestPhaseTreeDef, testExports);
        expect(testExports).toMatchSnapshot();
    });

    it('exposes all tasks globally', () => {
        const testExports = {};
        createPhaseTreeTasks(defaultTestPhaseTreeDef, testExports);

        console.log('>>>', JSON.stringify(Object.keys(testExports), null, 2));

        [
            'default',
            'installPhase:install:alpha',
            'installPhase:install:bravo',
            'installPhase:install:charlie',
            'installPhase',
            'runPhase:subInstallPhase:install:delta',
            'runPhase:subInstallPhase:install:echo',
            'runPhase:subInstallPhase:install:foxtrot',
            'runPhase:subInstallPhase',
            'runPhase:subRunPhase:subSubInstallPhase:install:golf',
            'runPhase:subRunPhase:subSubInstallPhase:install:hotel',
            'runPhase:subRunPhase:subSubInstallPhase:install:india',
            'runPhase:subRunPhase:subSubInstallPhase',
            'runPhase:subRunPhase:subSubVerifyPhase:verify:juliett',
            'runPhase:subRunPhase:subSubVerifyPhase:verify:kelo',
            'runPhase:subRunPhase:subSubVerifyPhase:verify:lima',
            'runPhase:subRunPhase:subSubVerifyPhase',
            'runPhase:subRunPhase',
            'runPhase:subVerifyPhase:verify:mike',
            'runPhase:subVerifyPhase:verify:november',
            'runPhase:subVerifyPhase:verify:oscar',
            'runPhase:subVerifyPhase',
            'runPhase',
            'verifyPhase:verify:papa',
            'verifyPhase:verify:quebec',
            'verifyPhase:verify:romeo',
            'verifyPhase:verify:sierra',
            'verifyPhase',
        ].forEach((taskName) => {
            expect(testExports).toHaveProperty(taskName);
        });
    });
});
