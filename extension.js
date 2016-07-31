const Lang = imports.lang;
const Shell = imports.gi.Shell;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;

const extensionLocations = ["/usr", "~/.local"];

let Aim = imports.ui.appDisplay.AppIconMenu;
let origin;
let launcher_primusrun;
let launcher_optirun;

function enable() {
    origin = Aim.prototype._redisplay;

    if (GLib.spawn_command_line_sync("which primusrun")[3] === 0) {
        launcher_primusrun = "Primusrun";
    }

    if (GLib.spawn_command_line_sync("which optirun")[3] === 0) {
        launcher_optirun = "Optirun";
    } else {
        Main.notifyError("gnome-optirun", "Error: Bumblebee is not installed");
        return;
    }

    Aim.prototype._redisplay = function () {
        origin.call(this, arguments);

        let i = 1;

        if (launcher_primusrun) {
            this._primusrun = new PopupMenu.PopupMenuItem(_(launcher_primusrun));
            this.addMenuItem(this._primusrun, this._getMenuItems().indexOf(this._newWindowMenuItem) + i);
            this._primusrun.connect("activate", Lang.bind(this, function () {
                if (this._source.app.state == Shell.AppState.STOPPED) {
                    this._source.animateLaunch();
                }

                Util.spawnApp([launcher_primusrun.toLowerCase(), _getCommand(this._source.app.get_id())]);
                this.emit('activate-window', null);
            }));
            ++i;
        }

        if (launcher_optirun) {
            this._optirun = new PopupMenu.PopupMenuItem(_(launcher_optirun));
            this.addMenuItem(this._optirun, this._getMenuItems().indexOf(this._newWindowMenuItem) + i);
            this._optirun.connect("activate", Lang.bind(this, function () {
                if (this._source.app.state == Shell.AppState.STOPPED) {
                    this._source.animateLaunch();
                }

                Util.spawnApp([launcher_optirun.toLowerCase(), _getCommand(this._source.app.get_id())]);
                this.emit('activate-window', null);
            }));
        }
    }
}

function disable() {
    Aim.prototype._redisplay = origin;
}

function _getCommand(file) {
    for (let i in extensionLocations) {
        try {
            let content = GLib.file_get_contents(extensionLocations[i] + "/share/applications/" + file)[1];
            let line = /Exec=.+/.exec(content)[0];

            return line.substr(5);
        } catch (error) {
            log(error);
        }
    }
}
