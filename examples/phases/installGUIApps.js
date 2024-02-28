const { ACTIONS, definePhase, isMac } = require('../../src');

module.exports = definePhase(
    'installMacGuiApps',
    ACTIONS.INSTALL_PACKAGES,
    [
        // 'deluge',
        // 'google-chrome',
        // 'homebrew/cask-drivers/logitech-options',
        // 'iterm2',

        // Prevent the Mac from sleeping
        'keepingyouawake',

        // Window management
        'rectangle',

        // Code editor
        'visual-studio-code',
    ],
    {
        targetOpts: {
            isGUI: true, // TODO: Needed anymore?
            skipAction: () => !isMac(),
            skipActionMessage: () =>
                "Can't install Mac GUI apps on non-mac machines 😉",
        },
    },
);
