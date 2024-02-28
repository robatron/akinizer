const { createTargetFromDef, Target } = require('../Target');

describe('Target', () => {
    it('creates a new target with options', () => {
        expect(
            new Target('target-name', {
                action: 'action',
                actionArgs: 'act-args',
                command: 'cmd',
                skipAction: 'skip-act',
            }),
        ).toMatchInlineSnapshot(`
            Target {
              "action": "action",
              "actionArgs": "act-args",
              "command": "cmd",
              "name": "target-name",
            }
        `);
    });

    it('creates a new Target with default vals', () => {
        expect(new Target('target-name')).toMatchInlineSnapshot(`
            Target {
              "action": undefined,
              "actionArgs": {},
              "command": "target-name",
              "name": "target-name",
            }
        `);
    });

    it('throws if name is not defined', () => {
        expect(() => {
            new Target();
        }).toThrowErrorMatchingInlineSnapshot(`"A target name is required"`);
    });

    describe('actionArgs', () => {
        const targetOpts = { a: 1, b: 2, c: 3 };

        it('fills actionArgs with all target options', () => {
            const target = new Target('target', targetOpts);
            expect(target.actionArgs).toStrictEqual(targetOpts);
        });

        it('uses only packageArgs if explicitly defined', () => {
            const actionArgs = { action: 'args' };
            const target = new Target('target', {
                ...targetOpts,
                actionArgs,
            });
            expect(target.actionArgs).toStrictEqual(actionArgs);
        });
    });
});

describe('createTargetFromDef', () => {
    describe('string-based target defs', () => {
        it('creates a new target object a string definition', () => {
            expect(createTargetFromDef('name', 'action')).toStrictEqual(
                new Target('name', { action: 'action' }),
            );
        });

        it('supports inherited target options', () => {
            expect(
                createTargetFromDef('name', 'action', { inherited: 'option' }),
            ).toStrictEqual(
                new Target('name', { action: 'action', inherited: 'option' }),
            );
        });
    });

    describe('array-based defs', () => {
        it('creates a new target object from an array definition', () => {
            expect(
                createTargetFromDef(['name', { target: 'option' }], 'action'),
            ).toStrictEqual(
                new Target('name', { action: 'action', target: 'option' }),
            );
        });

        it('supports inherited target options', () => {
            expect(
                createTargetFromDef(['name', { target: 'option' }], 'action', {
                    inherited: 'option',
                }),
            ).toStrictEqual(
                new Target('name', {
                    action: 'action',
                    inherited: 'option',
                    target: 'option',
                }),
            );
        });
    });

    it('throws if target definition is an unsupported type', () => {
        expect(() => {
            createTargetFromDef(123);
        }).toThrowErrorMatchingInlineSnapshot(
            `"Malformed target definition: 123"`,
        );
    });
});
