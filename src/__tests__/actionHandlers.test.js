const actionHandlers = require('../actionHandlers');
const { ACTIONS } = require('../constants');
const { execJob } = require('../execUtils');
const log = require('../log');
const { Target } = require('../Target');
const installGitPackage = require('../packageUtils/installGitPackage');
const installPackage = require('../packageUtils/installPackage');
const isPackageInstalled = require('../packageUtils/isPackageInstalled');

jest.mock('../execUtils');
jest.mock('../log');
jest.mock('../packageUtils/installGitPackage');
jest.mock('../packageUtils/installPackage');
jest.mock('../packageUtils/isPackageInstalled');

describe('actionHandlers', () => {
    const defaultTarget = new Target('target');

    describe('EXECUTE_JOBS', () => {
        it('executes the target job', () => {
            actionHandlers[ACTIONS.EXECUTE_JOBS](defaultTarget);

            expect(execJob).toHaveBeenCalledWith(defaultTarget);
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                [
                  [
                    "Executing job for 'target'...",
                  ],
                ]
            `);
        });
    });

    describe('INSTALL_PACKAGES', () => {
        const action = actionHandlers[ACTIONS.INSTALL_PACKAGES];

        it('force installs the target package', () => {
            const target = new Target('target', {
                forceAction: () => true,
            });

            action(target);

            expect(installPackage).toHaveBeenCalledWith(target);
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                [
                  [
                    "Forcing install of 'target'...",
                  ],
                ]
            `);
        });

        it('force installs the target git package', () => {
            const target = new Target('target', {
                forceAction: () => true,
                gitPackage: {},
            });

            action(target);

            expect(installGitPackage).toHaveBeenCalledWith(target);
        });

        it("skips target package installation if it's already installed", () => {
            isPackageInstalled.mockImplementationOnce(() => true);

            action(defaultTarget);

            expect(installPackage).not.toHaveBeenCalled();
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                [
                  [
                    "Checking if target package 'target' is installed...",
                  ],
                  [
                    "Target package 'target' is already installed. Moving on...",
                  ],
                ]
            `);
        });

        it("installs the package if it's not already", () => {
            isPackageInstalled.mockImplementationOnce(() => false);

            action(defaultTarget);

            expect(installPackage).toHaveBeenCalledWith(defaultTarget);
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                [
                  [
                    "Checking if target package 'target' is installed...",
                  ],
                  [
                    "Target package 'target' is not installed. Proceeding with installation...",
                  ],
                ]
            `);
        });
    });

    describe('VERIFY_PACKAGES', () => {
        const action = actionHandlers[ACTIONS.VERIFY_PACKAGES];

        it('verifies a target package is installed', () => {
            isPackageInstalled.mockImplementationOnce(() => true);

            action(defaultTarget);

            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                [
                  [
                    "Verifying target package target is installed...",
                  ],
                  [
                    "Target package 'target' is installed. Moving on...",
                  ],
                ]
            `);
        });

        it('throws if target package is not installed', async () => {
            isPackageInstalled.mockImplementationOnce(() => false);

            await expect(
                action(defaultTarget),
            ).rejects.toThrowErrorMatchingInlineSnapshot(
                `"Target package 'target' is not installed!"`,
            );
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                [
                  [
                    "Verifying target package target is installed...",
                  ],
                ]
            `);
        });
    });
});
