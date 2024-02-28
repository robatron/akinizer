const fs = require('fs');
const path = require('path');
const commandExistsSync = require('command-exists').sync;
const { exec } = require('shelljs');
const { getConfig } = require('../configUtils');
const log = require('../log');
const { isLinux, isMac } = require('../platformUtils');

// Return if a target is installed or not
const isPackageInstalled = (target) => {
    const { gitPackage, actionCommands, isGUI, verifyCommandExists } =
        target.actionArgs;

    // If this is a git target, check if its cloned, and its binaries exist
    if (gitPackage) {
        log.info(`Verifying git target '${target.name}'...'`);
        const { binSymlink } = gitPackage;

        const binDir = gitPackage.binDir
            ? gitPackage.binDir
            : getConfig().binInstallDir;
        const cloneDir = gitPackage.cloneDir
            ? gitPackage.cloneDir
            : path.join(getConfig().gitCloneDir, target.name);

        const isCloneDirPresent =
            fs.existsSync(cloneDir) && fs.lstatSync(cloneDir).isDirectory();

        let areBinsPresent = true;
        if (binSymlink) {
            const binSrc = path.join(cloneDir, binSymlink);
            const binDst = path.join(binDir, binSymlink);
            areBinsPresent =
                fs.existsSync(binSrc) &&
                fs.existsSync(binDst) &&
                fs.lstatSync(binDst).isSymbolicLink();
        }

        if (isCloneDirPresent && areBinsPresent) {
            return true;
        }

        return false;
    }

    // If the target has custom install commands, or verifyCommandExists is
    // explicitly set, verify the command exists in the environment as oppose
    // to verifying the target is installed via the system target manager.
    if (actionCommands || verifyCommandExists) {
        log.info(`Verifying command '${target.name}' exists...'`);
        return commandExistsSync(target.command);
    }

    // Otherwise, test if the target is installed via the system target manager.
    let cmd;

    if (isLinux()) {
        cmd = `dpkg -s '${target.name}'`;
    } else if (isMac()) {
        cmd = [
            'brew',
            'list',
            '--versions',
            isGUI && '--cask',
            `'${target.name}'`,
        ]
            .filter((frag) => frag)
            .join(' ');
    } else {
        throw new Error(
            `Verification for '${target.name}' failed: Unrecognized platform.`,
        );
    }

    log.info(`Verifying target '${target.name}' exists with \`${cmd}\`...'`);
    return !exec(cmd).code;
};

module.exports = isPackageInstalled;
