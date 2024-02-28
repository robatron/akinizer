const { definePhase, defineRoot, defineTarget } = require('../phaseUtils');
const { ACTIONS } = require('../constants');

const testTargets = ['target-a', 'target-b', 'target-c'];
const testOpts = { opt1: 'a', opt2: 'b' };

describe('definePhase', () => {
    it('creates a phase definition', () => {
        const result = definePhase('name', 'action', testTargets, testOpts);
        const expected = [
            'name',
            {
                action: 'action',
                targets: testTargets,
                ...testOpts,
            },
        ];
        expect(result).toEqual(expected);
    });

    it('supports default empty options', () => {
        const result = definePhase('name', 'action', testTargets);
        const expected = [
            'name',
            {
                action: 'action',
                targets: testTargets,
            },
        ];
        expect(result).toEqual(expected);
    });
});

describe('defineRoot', () => {
    it('creates a root phase definition', () => {
        const result = defineRoot(testTargets, true);
        const expected = [
            [
                'default',
                {
                    action: ACTIONS.RUN_PHASES,
                    parallel: true,
                    targets: testTargets,
                },
            ],
        ];
        expect(result).toEqual(expected);
    });

    it('leaverages definePhase', () => {
        const result = defineRoot(testTargets, true);
        const expected = [
            definePhase('default', ACTIONS.RUN_PHASES, testTargets, {
                parallel: true,
            }),
        ];
        expect(result).toEqual(expected);
    });

    it('defaults to series', () => {
        const result = defineRoot(testTargets);
        const expected = [
            definePhase('default', ACTIONS.RUN_PHASES, testTargets, {
                parallel: false,
            }),
        ];
        expect(result).toEqual(expected);
    });
});

describe('defineTarget', () => {
    it('defines a target with only a name', () => {
        expect(defineTarget('target')).toMatchInlineSnapshot(`
            [
              "target",
              {},
            ]
        `);
    });

    it('supports optional target opts', () => {
        expect(defineTarget('target', 'args')).toMatchInlineSnapshot(`
            [
              "target",
              "args",
            ]
        `);
    });
});
