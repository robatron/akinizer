# .bashrc file that gets injected into the local Docker development container.
# See the README for details.

export AK_ROOT=$(cat ~/.akroot)
export AK_EXAMPLES=$AK_ROOT/examples/

# Required for GPG to work correctly (for yadm decryption)
GPG_TTY=$(tty)
export GPG_TTY

# Sync mounted dir
function sync () {
    rsync -rltgoDv --delete --force --progress /mnt/akinizer/ $AK_ROOT --exclude node_modules/ --exclude .git --exclude **/__tmp__/
}
sync

# Activate fnm
eval "$(fnm env)"

cd $AK_EXAMPLES

cat <<-EOF


Welcome to the Akinizer development sandbox container!

- Run 'sync' to update the container repo with the host's repo
- Run 'gulp' to in the 'examples' directory to run the example akinizer config
- The sudo password is: abc123


EOF
