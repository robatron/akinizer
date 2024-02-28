const fs = require('fs');
const path = require('path');
const rmrf = require('rimraf');
const { v4: uuid } = require('uuid');
const log = require('../../log');
const { Target } = require('../../Target');
const installGitPackage = require('../installGitPackage');

jest.mock('../../execUtils');
jest.mock('../../log');
jest.mock('../../platformUtils');

// Allow a little more time for the git clone to finish
jest.setTimeout(15000);

const fixtureBasePath = path.join(
    path.dirname(__filename),
    '__fixtures__',
    path.basename(__filename),
);

describe('installGitPackage', () => {
    const defaultTestTargetName = 'tst-target';
    const ref = '7fd1a60b01f91b314f59955a4e4d4e80d8edf11d';
    const repoUrl = 'https://github.com/octocat/Hello-World.git';
    const binSymlink = 'README';
    const tempBasePath = path.join(fixtureBasePath, '__tmp__');

    let tempDir;
    let cloneDir;
    let binDir;
    let defaultTestTarget;
    let extendTestTarget;

    beforeEach(() => {
        tempDir = path.join(tempBasePath, uuid());
        cloneDir = path.join(tempDir, 'opt', defaultTestTargetName);
        binDir = path.join(tempDir, 'bin');
        defaultTestTarget = new Target(defaultTestTargetName, {
            gitPackage: { binDir, binSymlink, cloneDir, ref, repoUrl },
        });
        extendTestTarget = (gitPkgOverrides) =>
            new Target(defaultTestTarget.name, {
                gitPackage: {
                    ...defaultTestTarget.actionArgs.gitPackage,
                    ...gitPkgOverrides,
                },
            });
    });

    afterAll(() => {
        rmrf.sync(tempBasePath);
    });

    describe('basic cloning', () => {
        it('installs a target via git', async () => {
            await installGitPackage(defaultTestTarget);
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(true);
        });

        it('continues without error if target is already installed', async () => {
            await installGitPackage(defaultTestTarget);
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(true);
        });

        it('throws if `ref` is not specified', async () => {
            const testTarget = extendTestTarget({ ref: undefined });
            await expect(
                installGitPackage(testTarget),
            ).rejects.toThrowErrorMatchingInlineSnapshot(
                `"A specific \`ref\` is required. (Use \`master\` if you're lazy, but it's safer to use a specific ref, e.g., a tag or commit.)"`,
            );
        });

        it('throws if `ref` does not exist', async () => {
            const testTarget = extendTestTarget({ ref: 'invalid-ref' });
            await expect(installGitPackage(testTarget)).rejects
                .toThrowErrorMatchingInlineSnapshot(`
                        "Error cloning 'https://github.com/octocat/Hello-World.git' for target 'tst-target': Error: error: pathspec 'invalid-ref' did not match any file(s) known to git
                        "
                    `);
        });

        it('warns if `ref` is `master`', async () => {
            const testTarget = extendTestTarget({ ref: 'master' });
            await installGitPackage(testTarget);
            expect(log.warn.mock.calls).toMatchInlineSnapshot(`
                [
                  [
                    "Using \`master\` as the \`ref\` is unsafe! Use a specific ref, e.g., a tag or commit.",
                  ],
                ]
            `);
        });

        it('supports branch refs', async () => {
            const testTarget = extendTestTarget({ ref: 'test' });
            await installGitPackage(testTarget);
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(true);
        });
    });

    describe('undesireable cloning conditions', () => {
        it('throws on clone errors, cleans up empty clone directory', async () => {
            const testTarget = extendTestTarget({
                repoUrl: 'invalid-repo-url',
            });

            // Verify it throws when the repoUrl is missing
            await expect(installGitPackage(testTarget)).rejects
                .toThrowErrorMatchingInlineSnapshot(`
                        "Error cloning 'invalid-repo-url' for target 'tst-target': Error: fatal: repository 'invalid-repo-url' does not exist
                        "
                    `);

            // Verify it cleans up the created directories
            expect(fs.existsSync(binDir)).toBe(false);
            expect(fs.existsSync(cloneDir)).toBe(false);
        });

        it('warns if target directory exists, skips cloning', async () => {
            const targetDir = path.join(fixtureBasePath, 'existingCloneDir');
            const cloneDir = path.join(targetDir, 'opt', defaultTestTargetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(defaultTestTargetName, {
                gitPackage: { binDir, cloneDir, ref, repoUrl },
            });

            await installGitPackage(tstTarget);

            expect(log.warn).toHaveBeenCalledWith(
                expect.stringMatching(/directory exists/gi),
            );
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(false);
        });

        it('throws if target directory is a file', async () => {
            const targetDir = path.join(
                fixtureBasePath,
                'cloneDirFileCollision',
            );
            const cloneDir = path.join(targetDir, 'opt', defaultTestTargetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(defaultTestTargetName, {
                gitPackage: { binDir, binSymlink, cloneDir, ref, repoUrl },
            });

            await expect(installGitPackage(tstTarget)).rejects.toThrow(
                /Error installing target.*file exists/gi,
            );

            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(false);
        });
    });

    describe('symlinking functionality', () => {
        it('symlinks the target binary', async () => {
            const binSymlinkSrcPath = path.join(cloneDir, binSymlink);
            const binSymlinkDestPath = path.join(binDir, binSymlink);

            // Generate binary symlink target to avoid actually cloning
            fs.mkdirSync(cloneDir, { recursive: true });
            fs.closeSync(fs.openSync(binSymlinkSrcPath, 'w'));

            await installGitPackage(defaultTestTarget);

            expect(
                fs.existsSync(binSymlinkDestPath) &&
                    fs.lstatSync(binSymlinkDestPath).isSymbolicLink(),
            ).toBe(true);
        });

        it("doesn't symlink the target binary if omitted", async () => {
            const testTarget = extendTestTarget({ binSymlink: undefined });
            const binSymlinkDestPath = path.join(binDir, binSymlink);

            // Generate clone directory target to avoid actually cloning
            fs.mkdirSync(cloneDir, { recursive: true });

            await installGitPackage(testTarget);

            expect(
                fs.existsSync(binSymlinkDestPath) &&
                    fs.lstatSync(binSymlinkDestPath).isSymbolicLink(),
            ).toBe(false);
        });

        it("throws if the symlink doesn't exist in target", async () => {
            const targetDir = path.join(fixtureBasePath, 'fullyInstalled');
            const cloneDir = path.join(targetDir, 'opt', defaultTestTargetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(defaultTestTargetName, {
                gitPackage: {
                    binDir,
                    cloneDir,
                    binSymlink: 'non-existant-file.txt',
                    ref,
                    repoUrl,
                },
            });

            await expect(installGitPackage(tstTarget)).rejects.toThrow(
                /bin symlink does not exist/gi,
            );
        });

        it('warns if a symlink already exists', async () => {
            const targetDir = path.join(fixtureBasePath, 'fullyInstalled');
            const cloneDir = path.join(targetDir, 'opt', defaultTestTargetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(defaultTestTargetName, {
                gitPackage: {
                    binDir,
                    cloneDir,
                    binSymlink,
                    ref,
                    repoUrl,
                },
            });

            await installGitPackage(tstTarget);

            expect(log.warn).toHaveBeenCalledWith(
                expect.stringMatching(/error.*symlink exists/gi),
            );
        });

        it('throws if a non-symlink file exists', async () => {
            const targetDir = path.join(
                fixtureBasePath,
                'binSymlinkFileCollision',
            );
            const cloneDir = path.join(targetDir, 'opt', defaultTestTargetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(defaultTestTargetName, {
                gitPackage: {
                    binDir,
                    cloneDir,
                    binSymlink,
                    ref,
                    repoUrl,
                },
            });

            await expect(installGitPackage(tstTarget)).rejects.toThrow(
                /error.*file exists/gi,
            );
        });
    });

    describe('postInstall', () => {
        it('calls the post install if defined', async () => {
            const targetDir = path.join(fixtureBasePath, 'fullyInstalled');
            const cloneDir = path.join(targetDir, 'opt', defaultTestTargetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(defaultTestTargetName, {
                gitPackage: { binDir, cloneDir, binSymlink, ref, repoUrl },
                postInstall: jest.fn(),
            });

            await installGitPackage(tstTarget);

            expect(tstTarget.actionArgs.postInstall).toHaveBeenCalledTimes(1);
            expect(tstTarget.actionArgs.postInstall).toHaveBeenCalledWith(
                tstTarget,
            );
        });
    });
});
