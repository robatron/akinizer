const path = require('path');
const { exec } = require('shelljs');
const log = require('../../log');
const { Target } = require('../../Target');
const { isLinux, isMac } = require('../../platformUtils');
const isPackageInstalled = require('../isPackageInstalled');

jest.mock('shelljs', () => ({
    exec: jest.fn(() => ({
        code: 0,
    })),
}));
jest.mock('../../log');
jest.mock('../../platformUtils');

const fixtureBasePath = path.join(
    __dirname,
    '__fixtures__',
    path.basename(__filename),
);

describe('isPackageinstalled', () => {
    describe('git target support', () => {
        const createTestCase = (
            fixtureDir,
            expectedResult,
            binSymlink = null,
        ) => {
            const targetFixtureDir = path.join(fixtureBasePath, fixtureDir);
            const binDir = path.join(targetFixtureDir, 'bin');
            const cloneDir = path.join(targetFixtureDir, 'opt');

            const target = new Target('tst-target', {
                gitPackage: {
                    binDir,
                    binSymlink,
                    cloneDir,
                    repoUrl: 'https://github.com/octocat/Hello-World.git',
                },
            });

            it(`returns ${expectedResult} when ${fixtureDir}`, () => {
                expect(isPackageInstalled(target)).toBe(expectedResult);
            });
        };

        describe('when binSymlink is present', () => {
            [
                ['clonedAndSymlinked', true],
                ['justCloned', false],
                ['justSymlinked', false],
                ['neitherClonedNorSymlinked', false],
            ].forEach((paramCase) => {
                createTestCase(...paramCase, 'testFile.txt');
            });
        });

        describe('when binSymlink is not specified', () => {
            [
                ['clonedAndSymlinked', true],
                ['justCloned', true],
                ['justSymlinked', false],
                ['neitherClonedNorSymlinked', false],
            ].forEach((paramCase) => {
                createTestCase(...paramCase);
            });
        });

        describe('default dirs', () => {
            it('supports optional dirs', () => {
                const tstTarget = new Target('tst-target', { gitPackage: {} });
                expect(isPackageInstalled(tstTarget)).toBe(false);
            });
        });
    });

    describe('command existence', () => {
        it('verifies a command is available when the target has custom `actionCommands`', () => {
            const target = new Target('cd', { actionCommands: [] });
            expect(isPackageInstalled(target)).toBe(true);
        });

        it('verifies a command is available when `verifyCommandExists` is explicitly set', () => {
            const target = new Target('cd', { verifyCommandExists: true });
            expect(isPackageInstalled(target)).toBe(true);
        });

        it('returns false if a command does not exists', () => {
            const target = new Target('nänəɡˈzistənt', {
                verifyCommandExists: true,
            });
            expect(isPackageInstalled(target)).toBe(false);
        });
    });

    describe('system target manager verification', () => {
        describe('linux', () => {
            beforeEach(() => {
                isLinux.mockImplementation(() => true);
                isMac.mockImplementation(() => false);
            });

            it('queries `dpkg` for the target, returns true if installed', () => {
                exec.mockImplementationOnce(() => ({ code: 0 }));

                const target = new Target('target');
                const result = isPackageInstalled(target);

                expect(exec).toHaveBeenCalledWith("dpkg -s 'target'");
                expect(log.info).toHaveBeenCalledWith(
                    "Verifying target 'target' exists with `dpkg -s 'target'`...'",
                );
                expect(result).toBe(true);
            });

            it('... and false if not installed', () => {
                exec.mockImplementationOnce(() => ({ code: 1 }));

                const target = new Target('target');
                const result = isPackageInstalled(target);

                expect(exec).toHaveBeenCalledWith("dpkg -s 'target'");
                expect(log.info).toHaveBeenCalledWith(
                    "Verifying target 'target' exists with `dpkg -s 'target'`...'",
                );
                expect(result).toBe(false);
            });
        });

        describe('mac', () => {
            beforeEach(() => {
                isLinux.mockImplementation(() => false);
                isMac.mockImplementation(() => true);
            });

            it('queries `brew list` for the target, returns true if installed', () => {
                const target = new Target('target');
                const result = isPackageInstalled(target);

                expect(exec).toHaveBeenCalledWith(
                    "brew list --versions 'target'",
                );
                expect(log.info).toHaveBeenCalledWith(
                    "Verifying target 'target' exists with `brew list --versions 'target'`...'",
                );
                expect(result).toBe(true);
            });

            it('queries `brew list --cask` for the target if isGUI is set, returns true if installed', () => {
                const target = new Target('target', { isGUI: true });
                const result = isPackageInstalled(target);

                expect(exec).toHaveBeenCalledWith(
                    "brew list --versions --cask 'target'",
                );
                expect(log.info).toHaveBeenCalledWith(
                    "Verifying target 'target' exists with `brew list --versions --cask 'target'`...'",
                );
                expect(result).toBe(true);
            });

            it('... and returns false if not installed', () => {
                exec.mockImplementationOnce(() => ({ code: 1 }));

                const target = new Target('target');
                const result = isPackageInstalled(target);

                expect(exec).toHaveBeenCalledWith(
                    "brew list --versions 'target'",
                );
                expect(log.info).toHaveBeenCalledWith(
                    "Verifying target 'target' exists with `brew list --versions 'target'`...'",
                );
                expect(result).toBe(false);
            });
        });

        describe('other', () => {
            it('throws if the platform is not recognized', () => {
                isLinux.mockImplementationOnce(() => false);
                isMac.mockImplementationOnce(() => false);

                const target = new Target('target');

                expect(() => {
                    isPackageInstalled(target);
                }).toThrowErrorMatchingInlineSnapshot(
                    `"Verification for 'target' failed: Unrecognized platform."`,
                );
            });
        });
    });
});
