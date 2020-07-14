const commandExistsSync = require('command-exists').sync;
const { exec } = require('shelljs');
const { IS_LINUX, IS_MAC } = require('./platform');
const Package = require('./Package');

// Create a new package object from a definition
const createNewPackage = (pkg) => {
    if (typeof pkg === 'string') {
        return new Package(pkg);
    } else if (Array.isArray(pkg)) {
        const pkgName = pkg[0];
        const pkgMeta = pkg[1];
        return new Package(pkgName, pkgMeta);
    } else {
        throw new Error(`Malformed package definition: ${JSON.stringify(pkg)}`);
    }
};

// Install the specified package. Returns any encountered errors.
const installPackage = (pkg) => {
    const installCommands = [];

    // Pick install commands
    if (pkg.meta.installCommands) {
        pkg.meta.installCommands.forEach((cmd) => installCommands.push(cmd));
    } else if (IS_MAC) {
        installCommands.push(`brew install ${pkg.name}`);
    } else if (IS_LINUX) {
        installCommands.push(`sudo apt install -y ${pkg.name}`);
    } else {
        return `Cannot determine install command(s) for package '${pkg.name}'`;
    }

    // Run install commands
    for (let i = 0; i < installCommands.length; ++i) {
        const cmd = installCommands[i];
        const returnCode = exec(cmd).code;
        if (returnCode > 0) {
            const fullCommandMessage =
                installCommands.length > 1
                    ? ` Full command set: ${JSON.stringify(installCommands)}`
                    : '';
            return `Install command '${cmd}' failed for package '${pkg.name}'.${fullCommandMessage}`;
        }
    }

    // Return without error
    return null;
};

// Install a package via git
// TODO
const installPackageViaGit = (
    gitUrl,
    installDir = path.join(process.env['HOME'], 'opt'),
) => {};

// Return if a package is installed
const isPackageInstalled = (pkg, testFn) => {
    return testFn
        ? (() => {
              log.info(
                  `Using custom test to verify '${pkg.name}' is installed...`,
              );
              const result = testFn(pkg);
              if (!result) {
                  log.info(
                      `Custom test for '${pkg.name}' failed. Assuming not installed...`,
                  );
              }
              return result;
          })()
        : commandExistsSync(pkg.meta.command || pkg.name);
};

module.exports = { createNewPackage, installPackage, isPackageInstalled };
