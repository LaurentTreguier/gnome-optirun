const Lang = imports.lang;
const Shell = imports.gi.Shell;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;

const EXTENSION_NAME = "gnome-optirun";
const EXTENSION_AUTHOR = "TCG";
const DATA_DIRECTORIES = ["/usr", GLib.get_home_dir() + "/.local"];

let Aim = imports.ui.appDisplay.AppIconMenu;
let origin;
let launcher_primusrun;
let launcher_optiprime;
let launcher_optirun;

function enable() {
    origin = Aim.prototype._redisplay;

    if (GLib.spawn_command_line_sync("which primusrun")[3] === 0) {
        launcher_primusrun = "Primusrun";
        launcher_optiprime = "Optiprime";
    }

    if (GLib.spawn_command_line_sync("which optirun")[3] === 0) {
        launcher_optirun = "Optirun";
    } else {
        Main.notifyError("gnome-optirun", _("Error: Bumblebee is not installed"));
        return;
    }

    Aim.prototype._redisplay = function () {
        origin.call(this, arguments);
        let i = 1;

        this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(), _getNewWindowIndex(this) + i);
        ++i;

        if (launcher_primusrun) {
            _addLauncher(this, launcher_primusrun, launcher_primusrun.toLowerCase(), i);
            ++i;

            let optiprimeFile = [
                GLib.get_user_data_dir(),
                "gnome-shell",
                "extensions",
                EXTENSION_NAME + "@" + EXTENSION_AUTHOR,
                "optiprime"
            ].join("/");

            _addLauncher(this, launcher_optiprime, optiprimeFile, i);
            ++i;
        }

        if (launcher_optirun) {
            _addLauncher(this, launcher_optirun, launcher_optirun.toLowerCase(), i);
        }
    }
}

function disable() {
    Aim.prototype._redisplay = origin;
}

function _addLauncher(self, name, command, i) {
    let launcher = new PopupMenu.PopupMenuItem(_(name));

    self.addMenuItem(launcher, _getNewWindowIndex(self) + i);
    launcher.connect("activate", Lang.bind(self, function () {
        if (self._source.app.state == Shell.AppState.STOPPED) {
            self._source.animateLaunch();
        }

        Util.spawnApp([command, _getCommand(self._source.app.get_id())]);
        self.emit("activate-window", null);
    }));
}

function _getNewWindowIndex(self) {
    let appInfo = self._source.app.get_app_info();
    let windows = self._source.app.get_windows();
    let actions = appInfo.list_actions();

    return self._newWindowMenuItem
        ? self._getMenuItems().indexOf(self._newWindowMenuItem)
        : actions.indexOf("new-window") + windows.length + actions.length;
}

function _getCommand(file) {
    for (let i in DATA_DIRECTORIES) {
        try {
            let content = GLib.file_get_contents(DATA_DIRECTORIES[i] + "/share/applications/" + file)[1];
            let line = /Exec=.+/.exec(content)[0];

            return line.substr(5);
        } catch (error) {
            log(error);
        }
    }
}
