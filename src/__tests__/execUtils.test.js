const { exec } = require('shelljs');
const { execCommands, execJob } = require('../execUtils');
const log = require('../log');
const { Target } = require('../Target');

jest.mock('shelljs', () => ({
    exec: jest.fn(() => ({
        code: 0,
    })),
}));
jest.mock('../log');

describe('execCommands', () => {
    it('executes an array of shell commands', () => {
        execCommands(['a', 'b', 'c']);

        expect(log.info.mock.calls).toMatchInlineSnapshot(`
            [
              [
                "Executing command: a",
              ],
              [
                "Executing command: b",
              ],
              [
                "Executing command: c",
              ],
            ]
        `);
        expect(exec.mock.calls).toMatchInlineSnapshot(`
            [
              [
                "a",
              ],
              [
                "b",
              ],
              [
                "c",
              ],
            ]
        `);
    });

    it('throws if a command failed', () => {
        exec.mockImplementationOnce(() => ({ code: 1 }));

        expect(() => {
            execCommands(['a', 'b', 'c']);
        }).toThrowErrorMatchingInlineSnapshot(
            `"Command 'a' failed. Full command set: ["a","b","c"]"`,
        );

        expect(log.info.mock.calls).toMatchInlineSnapshot(`
            [
              [
                "Executing command: a",
              ],
            ]
        `);
        expect(exec.mock.calls).toMatchInlineSnapshot(`
            [
              [
                "a",
              ],
            ]
        `);
    });
});

describe('execJob', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws if target is missing actionCommands', () => {
        const target = new Target('target');

        expect(() => {
            execJob(target);
        }).toThrowErrorMatchingInlineSnapshot(
            `"Execute failed for target: Target option 'actionCommands' is required."`,
        );
    });

    it("throws if target's action commands are not an array", () => {
        const target = new Target('target', { actionCommands: 'not-an-array' });

        expect(() => {
            execJob(target);
        }).toThrowErrorMatchingInlineSnapshot(
            `"Execute failed for target: Option 'actionCommands' must be an array of commands to execute"`,
        );
    });

    it('executes actionCommands of a target', () => {
        const target = new Target('target', { actionCommands: ['cd', 'ls'] });

        execJob(target);

        target.actionArgs.actionCommands.forEach((cmd) => {
            expect(exec).toHaveBeenCalledWith(cmd);
        });
    });
});
