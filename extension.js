const Lang = imports.lang;
const Shell = imports.gi.Shell;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;

const extensionLocations = ["/usr", "~/.local"];

let Aim = imports.ui.appDisplay.AppIconMenu;
let origin;
let launcher;

function enable() {
    origin = Aim.prototype._redisplay;

    if(GLib.spawn_command_line_sync("which primusrun")[3] === 0) {
        launcher = "Primusrun"
    } else if(GLib.spawn_command_line_sync("which optirun")[3] === 0) {
        launcher = "Optirun"
    } else {
        Main.notifyError("Gnome-optirun error", "Bumblebee is not installed");

        return;
    }

    Aim.prototype._redisplay = function () {
        origin.call(this, arguments);

        this._optirun = new PopupMenu.PopupMenuItem(_(launcher));
        this.addMenuItem(this._optirun, this._getMenuItems()
            .indexOf(this._newWindowMenuItem) + 1);
        this._optirun.connect("activate", Lang.bind(this, function () {
            if(this._source.app.state == Shell.AppState.STOPPED) {
                this._source.animateLaunch();
            }

            Util.spawnApp([launcher.toLowerCase(), _getCommand(this._source.app.get_id())]);
            this.emit('activate-window', null);
        }));
    }
}

function disable() {
    Aim.prototype._redisplay = origin;
}

function _getCommand(file) {
    for(let i in extensionLocations) {
        try {
            let content = GLib.file_get_contents(extensionLocations[i] + "/share/applications/" + file)[1];
            let line = /Exec=.+/.exec(content)[0];

            return line.substr(5);
        } catch(error) {
            log(error);
        }
    }
}