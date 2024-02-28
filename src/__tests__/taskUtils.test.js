const gulp = require('gulp');
const actionHandlers = require('../actionHandlers');
const { ACTIONS } = require('../constants');
const log = require('../log');
const { definePhase } = require('../phaseUtils');
const { Target } = require('../Target');
const taskUtils = require('../taskUtils');
const isPackageInstalled = require('../packageUtils/isPackageInstalled');

jest.mock('gulp');
jest.mock('../actionHandlers');
jest.mock('../log');
jest.mock('../packageUtils/isPackageInstalled');

const defaultTestPackage = new Target('target-name', {
    action: ACTIONS.VERIFY_PACKAGES,
});

describe('createPackageFromDefTask', () => {
    it('returns and exports a task function, and sets the display name', () => {
        const testExports = {};
        const expectedTaskName = 'phase:target-name';

        const resultTask = taskUtils.createPackageFromDefTask(
            defaultTestPackage,
            testExports,
            'phase',
        );

        expect(resultTask.displayName).toBe(expectedTaskName);
        expect(typeof testExports[expectedTaskName]).toBe('function');
        expect(testExports[expectedTaskName]).toBe(resultTask);
    });

    it('throws if there is no handler for the given action', async () => {
        isPackageInstalled.mockReturnValue(false);

        const testPackage = new Target('target-name', {
            action: 'unsupportedAction',
        });

        expect(() => {
            taskUtils.createPackageFromDefTask(testPackage, {});
        }).toThrowErrorMatchingInlineSnapshot(
            `"Action 'unsupportedAction' for target 'target-name' is not supported"`,
        );
    });

    describe('the test task itself', () => {
        describe('action skipping', () => {
            it('skips the action if specified', async () => {
                const testPackage = new Target('target-name', {
                    action: defaultTestPackage.action,
                    skipAction: () => true,
                });
                const taskFn = taskUtils.createPackageFromDefTask(
                    testPackage,
                    {},
                );

                await taskFn();

                expect(log.warn.mock.calls).toMatchInlineSnapshot(`
                    [
                      [
                        "Skipping action 'verify-packages' for target 'target-name'",
                      ],
                    ]
                `);
            });

            it('adds an optional reason for skipping the action', async () => {
                const testPackage = new Target('target-name', {
                    action: defaultTestPackage.action,
                    skipAction: () => true,
                    skipActionMessage: () => 'For reasons',
                });
                const taskFn = taskUtils.createPackageFromDefTask(
                    testPackage,
                    {},
                );

                await taskFn();

                expect(log.warn.mock.calls).toMatchInlineSnapshot(`
                    [
                      [
                        "Skipping action 'verify-packages' for target 'target-name': For reasons",
                      ],
                    ]
                `);
            });
        });

        it('runs the action handler against the target', () => {
            const testPackage = new Target('target-name', {
                action: ACTIONS.EXECUTE_JOBS,
            });
            const taskFn = taskUtils.createPackageFromDefTask(testPackage, {});

            taskFn();

            expect(actionHandlers[testPackage.action]).toHaveBeenCalledWith(
                testPackage,
            );
        });
    });
});

describe('createPhaseTask', () => {
    const defaultPhaseName = 'testPhaseName';
    const defaultTargets = ['target-a', 'target-b', 'target-c'];

    beforeEach(() => {
        jest.clearAllMocks();

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

    ['INSTALL_PACKAGES', 'VERIFY_PACKAGES'].forEach((action) => {
        it(`creates tasks for ${action} action`, () => {
            const phaseDef = definePhase(
                defaultPhaseName,
                ACTIONS[action],
                defaultTargets,
            );

            const testExports = {};
            taskUtils.createPhaseTask(phaseDef, testExports);
            expect(testExports).toMatchSnapshot();
        });
    });

    it(`creates tasks for RUN_PHASES action`, () => {
        const phaseDef = definePhase(defaultPhaseName, ACTIONS.RUN_PHASES, [
            definePhase(
                defaultPhaseName,
                ACTIONS.INSTALL_PACKAGES,
                defaultTargets,
            ),
            definePhase(
                defaultPhaseName,
                ACTIONS.VERIFY_PACKAGES,
                defaultTargets,
            ),
        ]);

        const testExports = {};
        taskUtils.createPhaseTask(phaseDef, testExports);
        expect(testExports).toMatchSnapshot();
    });
});
