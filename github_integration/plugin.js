// Init namespace.
var github_integration = {};

// Strings
// en
var m = builder.translate.locales['en'].mapping;
m.__github_integration_settings = "GitHub Integration Settings";
m.__github_integration_username = "Username";
m.__github_integration_password = "Password";
m.__github_integration_connection_error = "Unable to connect to GitHub: {0}";
m.__github_integration_browse = "Browse GitHub";
m.__github_integration_repos = "{0}'s Repositories";
m.__github_integration_loading = "Loading...";
m.__github_integration_edit_settings = "Settings";
m.__github_integration_reload = "Reload";
m.__github_integration_add_from_github = "Add script from GitHub";
m.__github_integration_save_menu = "Save to GitHub";
m.__github_integration_save_as_menu = "Save to GitHub as...";
m.__github_integration_export_menu = "Export to GitHub";
m.__github_integration_save = "Save";
m.__github_integration_export = "Export";
m.__github_integration_enter_name = "Please enter a name for the script to save under.";
m.__github_integration_pwd_prompt = "Please enter the GitHub password for user {0}.";
m.__github_integration_saving = "Saving...";
m.__github_integration_save_error = "Unable to save. ({0})\nIt is possible that another commit interfered with the saving process.\nPlease try again.";
m.__github_integration_overwrite_q = "Are you sure you want to overwrite the file {0}?";
m.__github_integration_file_gone = "The file {0} no longer exists.";
m.__github_integration_save_suite_menu = "Save to GitHub";
m.__github_integration_save_suite_as_menu = "Save to GitHub as...";
m.__github_integration_export_suite_menu = "Export to GitHub";
m.__github_integration_invalid_path = "{0} is not a valid GitHub integration path.";
m.__github_integration_unable_to_load = "The file could not be loaded from GitHub: {0}";
m.__github_integration_auth_code_prompt = "You have enabled two-factor authentication for this GitHub account. Please enter the authentication code you received.";

// de
m = builder.translate.locales['de'].mapping;
m.__github_integration_settings = "GitHub Integration Einstellungen";
m.__github_integration_username = "Benutzername";
m.__github_integration_password = "Passwort";
m.__github_integration_connection_error = "Verbindung zu GitHub fehlgeschlagen: {0}";
m.__github_integration_browse = "Skript/Suite von GitHub";
m.__github_integration_repos = "Repositorys von {0}";
m.__github_integration_loading = "Lade...";
m.__github_integration_edit_settings = "Einstellungen";
m.__github_integration_reload = "Neu laden";
m.__github_integration_add_from_github = "Skript von GitHub hinzufügen";
m.__github_integration_save_menu = "Auf GitHub speichern";
m.__github_integration_save_as_menu = "Auf GitHub speichern als...";
m.__github_integration_export_menu = "Zu GitHub exportieren";
m.__github_integration_save = "Speichern";
m.__github_integration_export = "Exportieren";
m.__github_integration_enter_name = "Bitte geben Sie einen Namen für das Skript an.";
m.__github_integration_pwd_prompt = "GitHub-Passwort für den Benutzer \"{0}\"";
m.__github_integration_saving = "Wird gespeichert...";
m.__github_integration_save_error = "Das Skript oder die Suite konnte nicht gespeichert werden. ({0})\nMöglicherweise interferierte ein anderes Commit.\nVersuchen Sie es erneut.";
m.__github_integration_overwrite_q = "Das Dokument {0} überschreiben?";
m.__github_integration_file_gone = "Das Dokument {0} existiert nicht mehr.";
m.__github_integration_save_suite_menu = "Auf GitHub speichern";
m.__github_integration_save_suite_as_menu = "Auf GitHub speichern als...";
m.__github_integration_export_suite_menu = "Zu GitHub exportieren";
m.__github_integration_invalid_path = "Der Pfad {0} ist ungültig.";
m.__github_integration_unable_to_load = "Das Dokument konnte nicht geladen werden: {0}";
m.__github_integration_auth_code_prompt = "Sie haben Zwei-Faktor-Authentifizierung aktiviert. Bitte geben Sie den Authentication-Code ein, den Sie gerade empfangen haben.";

github_integration.shutdown = function() {
};

builder.io.addStorageSystem({
  "where": "github",
  "load": function(filePath, basePath, callback) {
    if (basePath) {
      var baseParentPath = basePath.path.split("/");
      baseParentPath.pop();
      baseParentPath = baseParentPath.join("/") + "/";
      github_integration.tryLoading(baseParentPath + filePath.path,
        function(text) {
          callback({'text': text, 'path': { 'path': baseParentPath + filePath.path, 'where': 'github' }});
        },
        function() {
          github_integration.tryLoading(filePath.path,
            function(text) {
              callback({'text': text, 'path': { 'path': filePath.path, 'where': 'github' }});
            },
            function(error) {
              callback(null, _t('__github_integration_unable_to_load', error));
            }
          );
        }
      );
    } else {
      github_integration.tryLoading(filePath.path,
        function(text) {
          callback({'text': text, 'path': { 'path': filePath.path, 'where': 'github' }});
        },
        function(error) {
          callback(null, _t('__github_integration_unable_to_load', error));
        }
      );
    }
  },
  "deriveRelativePath": function(path, basePath) {
    var baseParentPath = basePath.path.split("/");
    baseParentPath.pop();
    baseParentPath = baseParentPath.join("/") + "/";
    if (path.path.startsWith(baseParentPath)) {
      return { 'path': path.path.substring(baseParentPath.length), 'where': 'github' };
    } else {
      return path;
    }
  }
});

github_integration.tryLoading = function(path, success, failure) {
  success = success || function() {};
  failure = failure || function() {};
  // Disassemble path.
  var pathBits = path.split("/");
  if (pathBits.length < 5) {
    failure(_t('__github_integration_invalid_path', path));
    return;
  }
  var username = pathBits[0];
  var owner = pathBits[1];
  var repo = pathBits[2];
  var branch = pathBits[3];
  var name = pathBits[pathBits.length - 1];
  var inBranchPath = [];
  for (var i = 4; i < pathBits.length; i++) {
    inBranchPath.push(pathBits[i]);
  }
  inBranchPath = inBranchPath.join("/");
  
  var get = function(path, success) {
    github_integration.send(path, success, null, null, null, null, function(jqXHR, textStatus, errorThrown) {
      failure(errorThrown);
    });
  };
  
  get("repos/" + owner + "/" + repo + "/branches/" + branch, function(data) {
    var treeSHA = data.commit.commit.tree.sha;
    get("repos/" + owner + "/" + repo + "/git/trees/" + treeSHA + "?recursive=1", function(data) {
      var blobSHA = 0;
      for (var i = 0; i < data.tree.length; i++) {
        if (data.tree[i].path == inBranchPath) {
          blobSHA = data.tree[i].sha;
          break;
        }
      }
      if (!blobSHA) {
        failure(_t('__github_integration_file_gone', inBranchPath));
        return;
      }
      get("repos/" + owner + "/" + repo + "/git/blobs/" + blobSHA, function(data) {
        if (data.encoding == 'utf-8') {
          data = data.content;
        } else {
          data = bridge.decodeBase64(data.content.replace(/\n/g, ''));
        }
        success(data);
      });
    });
  });
};

github_integration.getFileUtils = function() {
  return bridge.FileUtils || bridge.SeFileUtils;
};

github_integration.loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);

github_integration.loginInfo = new Components.Constructor(
  "@mozilla.org/login-manager/loginInfo;1",
  Components.interfaces.nsILoginInfo,
  "init"
);

github_integration.getCredentials = function() {
  var logins = github_integration.loginManager.findLogins(
    {},
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'GitHub Integration User Login'
  );
  
  for (var i = 0; i < logins.length; i++) {
    return {'username': logins[i].username, 'password': logins[i].password};
  }
  return {'username': "", 'password': ""};
};

github_integration.setCredentials = function(username, password) {
  var logins = github_integration.loginManager.findLogins(
    {},
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'GitHub Integration User Login'
  );
  
  for (var i = 0; i < logins.length; i++) {
    github_integration.loginManager.removeLogin(logins[i]);
  }
  
  var loginInfo = new github_integration.loginInfo(
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'GitHub Integration User Login',
    /*username*/      username,
    /*password*/      password,
    /*usernameField*/ "",
    /*passwordField*/ ""
  );
  github_integration.loginManager.addLogin(loginInfo);
};

github_integration.getAuthToken = function(username) {
  var logins = github_integration.loginManager.findLogins(
    {},
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'GitHub Integration Auth Token'
  );
  
  for (var i = 0; i < logins.length; i++) {
    if (logins[i].username == username) {
      return logins[i].password;
    }
  }
  return null;
};

github_integration.setAuthToken = function(username, token) {
  var logins = github_integration.loginManager.findLogins(
    {},
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'GitHub Integration Auth Token'
  );
  
  for (var i = 0; i < logins.length; i++) {
    github_integration.loginManager.removeLogin(logins[i]);
  }
  
  var loginInfo = new github_integration.loginInfo(
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'GitHub Integration Auth Token',
    /*username*/      username,
    /*password*/      token,
    /*usernameField*/ "",
    /*passwordField*/ ""
  );
  github_integration.loginManager.addLogin(loginInfo);
};


github_integration.settingspanel = {};
/** The dialog. */
github_integration.settingspanel.dialog = null;

github_integration.settingspanel.show = function(callback, cancelCallback) {
  if (github_integration.settingspanel.dialog) { return; }
  jQuery('#edit-rc-connecting').hide();
  var credentials = github_integration.getCredentials();
  github_integration.settingspanel.dialog =
    newNode('div', {'class': 'dialog'},
      newNode('h3', _t('__github_integration_settings')),
      newNode('table', {style: 'border: none;', id: 'settings-table'},
        newNode('tr',
          newNode('td', _t('__github_integration_username') + " "),
          newNode('td', newNode('input', {id: 'github_integration-username', type: 'text', value: credentials.username}))
        ),
        newNode('tr',
          newNode('td', _t('__github_integration_password') + " "),
          newNode('td', newNode('input', {id: 'github_integration-password', type: 'password', value: credentials.password}))
        )
      ),
      newNode('a', {'href': '#', 'class': 'button', 'id': 'github_integration-ok', 'click': function() {
        var username = jQuery('#github_integration-username').val();
        var password = jQuery('#github_integration-password').val();
        github_integration.setCredentials(username, password);
        github_integration.settingspanel.hide();
        if (callback) { callback(); }
      }}, _t('ok')),
      newNode('a', {'href': '#', 'class': 'button', 'id': 'github_integration-cancel', 'click': function() {
        github_integration.settingspanel.hide();
        if (cancelCallback) { cancelCallback(); }
      }}, _t('cancel'))
    );
  builder.dialogs.show(github_integration.settingspanel.dialog);
};

github_integration.settingspanel.hide = function() {
  jQuery(github_integration.settingspanel.dialog).remove();
  github_integration.settingspanel.dialog = null;
  github_integration.forceShowSettingsPanel = false;
};

builder.registerPostLoadHook(function() {  
  builder.gui.addStartupEntry(_t('__github_integration_browse'), 'startup-browse-github', function() { github_integration.gitpanel.show(); });
  builder.gui.addStartupEntry(_t('__github_integration_settings'), 'startup-settings-github', function() { github_integration.settingspanel.show(); });
  
  builder.gui.menu.addItem('file', _t('__github_integration_save_menu'), 'file-github_integration-save', function() {
    var script = builder.getScript();
    if (script.path && script.path.where == 'github') {
      github_integration.saveFile(script, script.path.path, null, /* suppressOverwriteWarning */ true, script.path.format);
    } else {
      var s = builder.getScript();
      github_integration.gitpanel.scriptToSave = s;
      if (s.path && s.path.format) {
        if (s.seleniumVersion == builder.selenium1) {
          github_integration.gitpanel.sel1SelectedSaveFormat = s.path.format;
        } else {
          github_integration.gitpanel.sel2SelectedSaveFormat = s.path.format;
        }
      }
      github_integration.gitpanel.show(github_integration.SAVE);
    }
  });
  
  builder.gui.menu.addItem('file', _t('__github_integration_save_as_menu'), 'file-github_integration-save-as', function() {
    github_integration.gitpanel.scriptToSave = builder.getScript();
    github_integration.gitpanel.show(github_integration.SAVE);
  });
  
  builder.gui.menu.addItem('file', _t('__github_integration_export_menu'), 'file-github_integration-export', function() {
    github_integration.gitpanel.scriptToSave = builder.getScript();
    github_integration.gitpanel.show(github_integration.EXPORT);
  });
  
  builder.gui.menu.addItem('suite', _t('__github_integration_add_from_github'), 'suite-github_integration_add_from_github', function() {
    github_integration.gitpanel.show(github_integration.ADD);
  });
  
  builder.gui.menu.addItem('suite', _t('__github_integration_save_suite_menu'), 'file-github_integration-save-suite', function() {
    if (!builder.suite.isSaveable()) { alert(_t('suite_cannot_save_unsaved_scripts')); return; }
    if (builder.suite.path && builder.suite.path.where == 'github') {
      github_integration.gitpanel.mode = github_integration.SAVE_SUITE;
      github_integration.saveSuite(builder.suite.scripts, builder.suite.path.path, null, /* suppressOverwriteWarning */ true, builder.suite.getCommonSeleniumVersion());
    } else {
      var version = builder.suite.getCommonSeleniumVersion();
      github_integration.gitpanel.suiteSeleniumVersion = builder.suite.getCommonSeleniumVersion();
      github_integration.gitpanel.suiteToSave = builder.suite.scripts;
      github_integration.gitpanel.suitePath = builder.suite.path;
      github_integration.gitpanel.show(github_integration.SAVE_SUITE);
    }
  });
  
  builder.gui.menu.addItem('suite', _t('__github_integration_save_suite_as_menu'), 'file-github_integration-save-suite-as', function() {
    if (!builder.suite.isSaveable()) { return; }
    github_integration.gitpanel.suiteSeleniumVersion = builder.suite.getCommonSeleniumVersion();
    github_integration.gitpanel.suiteToSave = builder.suite.scripts;
    github_integration.gitpanel.suitePath = builder.suite.path;
    github_integration.gitpanel.show(github_integration.SAVE_SUITE);
  });
  
  builder.gui.menu.addItem('suite', _t('__github_integration_export_suite_menu'), 'file-github_integration-export-suite', function() {
    if (!builder.suite.isExportable()) { return; }
    github_integration.gitpanel.suiteSeleniumVersion = builder.suite.getCommonSeleniumVersion();
    github_integration.gitpanel.suiteToSave = builder.suite.scripts;
    github_integration.gitpanel.suitePath = builder.suite.exportpath;
    github_integration.gitpanel.show(github_integration.EXPORT_SUITE);
  });
});

github_integration.UNLOADED  = 0;
github_integration.LOADING   = 1;
github_integration.LOADED    = 2;

github_integration.repos = {"state": github_integration.UNLOADED, "list": []};
github_integration.lastLoadUsername = '';
github_integration.forceShowSettingsPanel = false;
github_integration.openPaths = {};

github_integration.OPEN = 0;
github_integration.ADD = 1;
github_integration.SAVE = 2;
github_integration.EXPORT = 3;
github_integration.SAVE_SUITE = 4;
github_integration.EXPORT_SUITE = 5;
github_integration.VIEW = 6;

github_integration.gitpanel = {};
github_integration.gitpanel.dialog = null;
github_integration.gitpanel.lastScrollTop = 0;
github_integration.gitpanel.mode = github_integration.OPEN;
github_integration.gitpanel.scriptToSave = null;
github_integration.gitpanel.onReloadCallback = null;
github_integration.gitpanel.onReloadCallbackPath = null;
github_integration.gitpanel.availableSaveFormats = [];
github_integration.gitpanel.sel1SelectedSaveFormat = null;
github_integration.gitpanel.sel2SelectedSaveFormat = null;
github_integration.gitpanel.suiteToSave = null;
github_integration.gitpanel.suitePath = null;
github_integration.gitpanel.suiteSeleniumVersion = null;

github_integration.gitpanel.show = function(mode) {
  mode = mode || github_integration.OPEN;
  var credentials = github_integration.getCredentials();
  if (!credentials.username || !credentials.password || github_integration.forceShowSettingsPanel) {
    github_integration.settingspanel.show(function() { github_integration.gitpanel.doShow(mode); });
  } else {
    github_integration.gitpanel.doShow(mode);
  }
};

github_integration.gitpanel.doShow = function(mode) {
  if (github_integration.gitpanel.mode != mode) {
    github_integration.gitpanel.hide();
  }
  github_integration.gitpanel.mode = mode;
  if (github_integration.gitpanel.dialog === null) {
    github_integration.gitpanel.dialog = newNode('div', {'class': 'dialog'},
      newNode('h3', _t('__github_integration_repos', github_integration.getCredentials().username)),
      newNode('div', {'id': 'repo-list-options', 'style': "margin-bottom: 8px;"},
        newNode('a', {'href': '#', 'click': github_integration.gitpanel.editSettings, 'id': 'repo-list-settings', 'style': "display: none;"}, _t('__github_integration_edit_settings')),
        newNode('a', {'href': '#', 'style': "float: right;", 'click': function() { github_integration.gitpanel.load(true); }},
          newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'reload.png'), 'title': _t('__github_integration_reload'), 'style': "vertical-align: middle; display: none;", 'id': 'repo-list-reload'})
        ),
        newNode('span', {'id': 'repo-list-loading', 'style': "float: right;"}, newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'spinner.gif'), 'style': "vertical-align: middle; margin-right: 3px;"}), _t('__github_integration_loading'))
      ),
      newNode('ul', {'id': 'repo-list', 'style': "display: block; overflow: auto; height: 300px; margin-bottom: 8px;"}),
      newNode('a', {'href': '#', 'class': 'button', 'id': 'repo-list-close', 'click': function() {
        github_integration.gitpanel.hide();
      }}, _t('close'))
    );
    builder.dialogs.show(github_integration.gitpanel.dialog);
  }
  github_integration.gitpanel.load(/*reload*/ github_integration.getCredentials().username != github_integration.lastLoadUsername, function() {
    jQuery('#repo-list').scrollTop(github_integration.gitpanel.lastScrollTop);
  });
};

github_integration.gitpanel.editSettings = function() {
  github_integration.gitpanel.hide();
  github_integration.settingspanel.show(github_integration.gitpanel.show, github_integration.gitpanel.show);
};

github_integration.gitpanel.hide = function() {
  if (jQuery('#repo-list').is(":visible")) {
    github_integration.gitpanel.lastScrollTop = jQuery('#repo-list').scrollTop() || 0;
  }
  jQuery(github_integration.gitpanel.dialog).remove();
  github_integration.gitpanel.dialog = null;
};

github_integration.gitpanel.getAllRepos = function(callback) {
  github_integration.getPaginated("user/orgs", function(orgs) {
    function getRepos(allRepos, i) {
      if (i < orgs.length) {
        github_integration.getPaginated("orgs/" + orgs[i].login + "/repos", function(data) {
          getRepos(allRepos.concat(data), i + 1);
        });
      } else {
        github_integration.getPaginated("user/repos", function(data) {
          callback(allRepos.concat(data));
        });
      }
    }
    getRepos([], 0); 
  });
};

github_integration.gitpanel.load = function(reload, callback) {
  if (github_integration.repos.state == github_integration.LOADED && !reload) {
    github_integration.gitpanel.populateList();
    jQuery('#repo-list-loading').hide();
    jQuery('#repo-list-settings').show();
    jQuery('#repo-list-reload').show();
    if (callback) { callback(); }
  } else {
    github_integration.lastLoadUsername = github_integration.getCredentials().username;
    github_integration.repos.state = github_integration.LOADING;
    jQuery('#repo-list-loading').show();
    github_integration.gitpanel.getAllRepos(function(data) {
      github_integration.repos.state = github_integration.LOADED;
      jQuery('#repo-list-loading').hide();
      var username = github_integration.getCredentials().username;
      var l = [];
      github_integration.repos.list = l;
      var fullnames = {};
      for (var i = 0; i < data.length; i++) {
        if (fullnames[data[i].full_name]) {
          continue;
        } else {
          fullnames[data[i].full_name] = 1;
        }
        l.push({
          'name': data[i].full_name.toLowerCase().startsWith(username.toLowerCase() + "/") ? data[i].name : data[i].full_name,
          'id': data[i].full_name.replace('/', "-SLASH-"),
          'full_name': data[i].full_name,
          'writeable': data[i].permissions.push,
          'state': github_integration.UNLOADED,
          'branches': [],
          'path': username + '/' + data[i].full_name
        });
      }
      l.sort(function(a, b) {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0);
      });
      github_integration.gitpanel.populateList();
      jQuery('#repo-list-loading').hide();
      jQuery('#repo-list-settings').show();
      jQuery('#repo-list-reload').show();
      if (callback) { callback(); }
    },
    /*error*/ function(jqXHR, textStatus, errorThrown) {
      github_integration.repos.state = github_integration.UNLOADED;
      github_integration.gitpanel.hide();
      github_integration.forceShowSettingsPanel = true;
    });
  }
};

github_integration.gitpanel.populateList = function() {
  jQuery('#repo-list').html('');
  for (var i = 0; i < github_integration.repos.list.length; i++) {
    jQuery('#repo-list').append(github_integration.gitpanel.makeRepoEntry(github_integration.repos.list[i]));
  }
  for (var i = 0; i < github_integration.repos.list.length; i++) {
    var e = github_integration.repos.list[i];
    if (github_integration.openPaths[e.path]) {
      github_integration.openPaths[e.path] = false;
      github_integration.gitpanel.toggleRepoEntry(e);
    }
  }
};

github_integration.gitpanel.makeRepoEntry = function(e) {
  return newNode('li',
    newNode('a', {'href': '#', 'click': function() {github_integration.gitpanel.toggleRepoEntry(e);}},
      newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'closed.png'), 'id': 'repo-list-' + e.id + '-triangle', 'style': "vertical-align: middle;"}),
      e.name
    ),
    newNode('a', {'href': '#', 'click': function() {github_integration.gitpanel.reloadRepoEntry(e);}},
      newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'reload.png'), 'id': 'repo-list-' + e.id + '-reload', 'style': "margin-left: 5px; display: none; vertical-align: middle;", 'title': _t('__github_integration_reload')})
    ),
    newNode('ul', {'id': 'repo-list-' + e.id + '-ul'})
  );
};

github_integration.gitpanel.toggleRepoEntry = function(e) {
  if (github_integration.openPaths[e.path]) {
    github_integration.openPaths[e.path] = false;
    jQuery('#repo-list-' + e.id + '-triangle')[0].src = builder.plugins.getResourcePath('github_integration', 'closed.png');
    jQuery('#repo-list-' + e.id + '-reload').hide();
    jQuery('#repo-list-' + e.id + '-ul').html('');
  } else {
    if (e.state == github_integration.UNLOADED) {
      github_integration.gitpanel.reloadRepoEntry(e);
    } else if (e.state == github_integration.LOADED) {
      github_integration.gitpanel.populateRepoEntry(e);
    }
  }
};

github_integration.gitpanel.reloadRepoEntry = function(e) {
  e.state = github_integration.LOADING;
  jQuery('#repo-list-' + e.id + '-triangle')[0].src = builder.plugins.getResourcePath('github_integration', 'spinner.gif');
  jQuery('#repo-list-' + e.id + '-reload').hide();
  github_integration.send("repos/" + e.full_name + "/branches",
    /*success*/ function(data) {
      e.state = github_integration.LOADED;
      var l = [];
      e.branches = l;
      for (var i = 0; i < data.length; i++) {
        l.push({
          'name': data[i].name,
          'id': e.id + '-SLASH-' + data[i].name,
          'state': github_integration.UNLOADED,
          'children': [],
          'path': e.path + '/' + data[i].name,
          'sha': data[i].commit.sha
        });
      }
      l.sort(function(a, b) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      });
      github_integration.gitpanel.populateRepoEntry(e);
    },
    /*error*/ function(data) {
      github_integration.repos.state = github_integration.UNLOADED;
      github_integration.gitpanel.hide();
      github_integration.forceShowSettingsPanel = true;
    }
  );
};

github_integration.gitpanel.populateRepoEntry = function(e) {
  jQuery('#repo-list-' + e.id + '-reload').show();
  jQuery('#repo-list-' + e.id + '-triangle')[0].src = builder.plugins.getResourcePath('github_integration', 'open.png');
  github_integration.openPaths[e.path] = true;
  jQuery('#repo-list-' + e.id + '-ul').html('');
  for (var i = 0; i < e.branches.length; i++) {
    jQuery('#repo-list-' + e.id + '-ul').append(github_integration.gitpanel.makeTreeEntry(e, null, e.branches[i]));
  }
  
  for (var i = 0; i < e.branches.length; i++) {
    var b = e.branches[i];
    if (github_integration.openPaths[b.path]) {
      github_integration.openPaths[b.path] = false;
      github_integration.gitpanel.toggleTreeEntry(e, null, b);
    }
  }
};

github_integration.gitpanel.makeTreeEntry = function(e, parent, tree) {
  return newNode('li', {'style': "padding-left: 12px;"},
    newNode('a', {'href': '#', 'click': function() {github_integration.gitpanel.toggleTreeEntry(e, parent, tree);}},
      newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'closed.png'), 'id': 'repo-list-' + tree.id + '-triangle', 'style': "vertical-align: middle;"}),
      newNode('span', {'id': 'repo-list-' + tree.id + '-name'}, tree.name)
    ),
    newNode('a', {'href': '#', 'click': function() {github_integration.gitpanel.reloadTreeEntry(e, parent, tree);}},
      newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'reload.png'), 'id': 'repo-list-' + tree.id + '-reload', 'style': "margin-left: 5px; display: none; vertical-align: middle;", 'title': _t('__github_integration_reload')})
    ),
    newNode('ul', {'id': 'repo-list-' + tree.id + '-ul'})
  );
};

github_integration.gitpanel.toggleTreeEntry = function(e, parent, tree) {
  if (github_integration.openPaths[tree.path]) {
    github_integration.openPaths[tree.path] = false;
    jQuery('#repo-list-' + tree.id + '-triangle')[0].src = builder.plugins.getResourcePath('github_integration', 'closed.png');
    jQuery('#repo-list-' + tree.id + '-reload').hide();
    jQuery('#repo-list-' + tree.id + '-ul').html('');
  } else {
    if (tree.state == github_integration.UNLOADED) {
      github_integration.gitpanel.reloadTreeEntry(e, parent, tree);
    } else if (tree.state == github_integration.LOADED) {
      github_integration.gitpanel.populateTreeEntry(e, parent, tree);
    }
  }
};

github_integration.gitpanel.reloadTreeEntry = function(e, parent, tree) {
  tree.state = github_integration.LOADING;
  jQuery('#repo-list-' + tree.id + '-triangle')[0].src = builder.plugins.getResourcePath('github_integration', 'spinner.gif');
  jQuery('#repo-list-' + tree.id + '-reload').hide();
  github_integration.send("repos/" + e.full_name + "/git/trees/" + tree.sha,
    /*success*/ function(data) {
      tree.state = github_integration.LOADED;
      tree.children = [];
      for (var i = 0; i < data.tree.length; i++) {
        var c = {
          'name': data.tree[i].path,
          'type': data.tree[i].type,
          'sha': data.tree[i].sha,
          'state': github_integration.UNLOADED,
          'children': [],
          'path': tree.path + '/' + data.tree[i].path,
          'id': e.id + '-SLASH-' + data.tree[i].sha
        };
        tree.children.push(c);
      }
      tree.children.sort(function(a, b) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      });
      github_integration.gitpanel.populateTreeEntry(e, parent, tree);
    },
    /*error*/ function(data) {
      github_integration.repos.state = github_integration.UNLOADED;
      github_integration.gitpanel.hide();
      github_integration.forceShowSettingsPanel = true;
    }
  );
};

github_integration.gitpanel.storeAndGetChosenFormat = function() {
  var format = null;
  if (jQuery('#github-save-li-format-chooser-2').length > 0) {
    format = github_integration.gitpanel.availableSaveFormats[jQuery('#github-save-li-format-chooser-2').val()];
  }
  if (!format && jQuery('#github-save-li-format-chooser').length > 0) {
    format = github_integration.gitpanel.availableSaveFormats[jQuery('#github-save-li-format-chooser').val()];
  }
  if (format) {
    if (github_integration.gitpanel.scriptToSave.seleniumVersion == builder.selenium1) {
      github_integration.gitpanel.sel1SelectedSaveFormat = format;
    } else {
      github_integration.gitpanel.sel2SelectedSaveFormat = format;
    }
  }
  return format;
};

github_integration.gitpanel.populateTreeEntry = function(e, parent, tree) {
  jQuery('#repo-list-' + tree.id + '-reload').show();
  jQuery('#repo-list-' + tree.id + '-triangle')[0].src = builder.plugins.getResourcePath('github_integration', 'open.png');
  github_integration.openPaths[tree.path] = true;
  jQuery('#repo-list-' + tree.id + '-ul').html('');
    
  if (github_integration.gitpanel.mode == github_integration.SAVE || github_integration.gitpanel.mode == github_integration.EXPORT) {
    var txt = jQuery('#github-save-input').val();
    var sel = jQuery('#github-save-input')[0] ? jQuery('#github-save-input')[0].selectionStart : 0;
    var selEnd = jQuery('#github-save-input')[0] ? jQuery('#github-save-input')[0].selectionEnd : 0;
    if (github_integration.gitpanel.mode == github_integration.EXPORT) {
      // Store which format was chosen in the last format chooser, if there is one.
      github_integration.gitpanel.storeAndGetChosenFormat();
      if (!txt) {
        if (github_integration.gitpanel.scriptToSave.seleniumVersion == builder.selenium1) {
          if (github_integration.gitpanel.sel1SelectedSaveFormat) {
            txt = github_integration.gitpanel.sel1SelectedSaveFormat.extension;
          } else {
            txt = github_integration.gitpanel.scriptToSave.seleniumVersion.io.defaultRepresentationExtension;
          }
        } else {
          if (github_integration.gitpanel.sel2SelectedSaveFormat) {
            txt = github_integration.gitpanel.sel2SelectedSaveFormat.extension;
          } else {
            txt = github_integration.gitpanel.scriptToSave.seleniumVersion.io.defaultRepresentationExtension;
          }
        }
      }
    } else {
      if (!txt) {
        txt = github_integration.gitpanel.scriptToSave.seleniumVersion.io.defaultRepresentationExtension;
      }
    }
    jQuery('#github-save-li').remove();
    jQuery('#github-save-li-format-div-2').remove();
    jQuery('#repo-list-' + tree.id + '-ul').append(newNode('li', { 'id': 'github-save-li', 'style': "padding-left: 12px;" },
      newNode('span', {'id': 'github-save-li-ui'},
        newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'file.png'), 'id': 'repo-list-saving-file', 'style': "vertical-align: middle;"}),
        newNode('input', { 'id': 'github-save-input', 'type': 'text', 'value': txt || "", 'keypress': function (evt) {
          if (evt.which == 13) { // Hit enter to save.
            github_integration.gitpanel.doSave(e, parent, tree);
          }
        }}),
        newNode('a', { 'href': '#', 'class': 'button', 'style': "margin-left: 5px;", 'click': function() { github_integration.gitpanel.doSave(e, parent, tree); } },
          github_integration.gitpanel.mode == github_integration.EXPORT ? _t('__github_integration_export') : _t('__github_integration_save')
        )
      ),
      newNode('span', {'id': 'github-save-li-saving', 'style': "display: none;"},
        newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'spinner.gif'), 'id': 'repo-list-saving-spinner', 'style': "vertical-align: middle;"}),
        _t('__github_integration_saving')
      )
    ));
    
    if (github_integration.gitpanel.mode == github_integration.EXPORT) {
      jQuery('#github-save-li-ui').append(newNode('div', {'id': 'github-save-li-format-div', 'style': "margin-left: 16px;"},
        newNode('select', {
          'id': 'github-save-li-format-chooser',
          'change': github_integration.gitpanel.updateExtension
        })
      ));
      github_integration.gitpanel.populateFormatChooser('github-save-li-format-chooser');
    }
    
    jQuery('#github-save-input').focus();
    jQuery('#github-save-input')[0].selectionStart = sel;
    jQuery('#github-save-input')[0].selectionEnd = selEnd;
  }
  
  if (github_integration.gitpanel.mode == github_integration.SAVE_SUITE || github_integration.gitpanel.mode == github_integration.EXPORT_SUITE) {
    var txt = jQuery('#github-save-suite-input').val();
    var sel = jQuery('#github-save-suite-input')[0] ? jQuery('#github-save-suite-input')[0].selectionStart : 0;
    var selEnd = jQuery('#github-save-suite-input')[0] ? jQuery('#github-save-suite-input')[0].selectionEnd : 0;
    
    if (github_integration.gitpanel.mode == github_integration.EXPORT_SUITE) {
      txt = txt || builder.suite.getCommonExportFormat().extension;
    } else {
      txt = txt || builder.suite.getCommonSeleniumVersion().io.getSaveSuiteFormat().extension;
    }
    
    jQuery('#github-save-suite-li').remove();
    jQuery('#github-save-suite-li-format-div-2').remove();
    jQuery('#repo-list-' + tree.id + '-ul').append(newNode('li', { 'id': 'github-save-suite-li', 'style': "padding-left: 12px;" },
      newNode('span', {'id': 'github-save-suite-li-ui'},
        newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'file.png'), 'id': 'repo-list-saving-suite', 'style': "vertical-align: middle;"}),
        newNode('input', { 'id': 'github-save-suite-input', 'type': 'text', 'value': txt || "", 'keypress': function (evt) {
          if (evt.which == 13) { // Hit enter to save.
            github_integration.gitpanel.doSaveSuite(e, parent, tree);
          }
        }}),
        newNode('a', { 'href': '#', 'class': 'button', 'style': "margin-left: 5px;", 'click': function() { github_integration.gitpanel.doSaveSuite(e, parent, tree); } },
          _t('__github_integration_save')
        )
      ),
      newNode('span', {'id': 'github-save-suite-li-saving', 'style': "display: none;"},
        newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'spinner.gif'), 'id': 'repo-list-saving-suite-spinner', 'style': "vertical-align: middle;"}),
        _t('__github_integration_saving')
      )
    ));
    
    jQuery('#github-save-suite-input').focus();
    jQuery('#github-save-suite-input')[0].selectionStart = sel;
    jQuery('#github-save-suite-input')[0].selectionEnd = selEnd;
  }
  
  for (var i = 0; i < tree.children.length; i++) {
    if (tree.children[i].type == 'tree') {
      jQuery('#repo-list-' + tree.id + '-ul').append(github_integration.gitpanel.makeTreeEntry(e, tree, tree.children[i]));
    }
    if (tree.children[i].type == 'blob') {
      jQuery('#repo-list-' + tree.id + '-ul').append(github_integration.gitpanel.makeBlobEntry(e, tree, tree.children[i]));
    }
  }
  
  for (var i = 0; i < tree.children.length; i++) {
    var c = tree.children[i];
    if (github_integration.openPaths[c.path]) {
      github_integration.openPaths[c.path] = false;
      github_integration.gitpanel.toggleTreeEntry(e, tree, c);
    }
  }
  
  for (var i = 0; i < tree.children.length; i++) {
    var c = tree.children[i];
    if (c.path == github_integration.gitpanel.onReloadCallbackPath) {
      github_integration.gitpanel.onReloadCallback(c.id);
    }
  }
};

github_integration.gitpanel.doSave = function(e, parent, tree) {
  var txt = jQuery('#github-save-input').val();
  if (!txt) {
    alert(_t('__github_integration_enter_name'));
  } else {
    var format = null;
    if (github_integration.gitpanel.mode == github_integration.EXPORT) {
      format = github_integration.gitpanel.availableSaveFormats[jQuery('#github-save-li-format-chooser').val()];
      if (github_integration.gitpanel.scriptToSave.seleniumVersion == builder.selenium1) {
        github_integration.gitpanel.sel1SelectedSaveFormat = format;
      } else {
        github_integration.gitpanel.sel2SelectedSaveFormat = format;
      }
    } else {
      if (github_integration.gitpanel.scriptToSave.seleniumVersion == builder.selenium1) {
        format = github_integration.gitpanel.sel1SelectedSaveFormat;
      } else {
        format = github_integration.gitpanel.sel2SelectedSaveFormat;
      }
    }
    github_integration.saveFile(github_integration.gitpanel.scriptToSave, tree.path + '/' + txt, e, /*suppressOverwriteWarning*/ false, format);
  }
};

github_integration.gitpanel.doSaveSuite = function(e, parent, tree) {
  var txt = jQuery('#github-save-suite-input').val();
  if (!txt) {
    alert(_t('__github_integration_enter_name'));
  } else {
    github_integration.saveSuite(github_integration.gitpanel.suiteToSave, tree.path + '/' + txt, e, /*suppressOverwriteWarning*/ false, github_integration.gitpanel.suiteSeleniumVersion);
  }
};

github_integration.gitpanel.updateExtension = function() {
  // Update the extension automatically.
  var txt = jQuery('#github-save-input').val();
  var oldFormat = null;
  var format = github_integration.gitpanel.availableSaveFormats[jQuery('#github-save-li-format-chooser').val()];
  if (github_integration.gitpanel.scriptToSave.seleniumVersion == builder.selenium1) {
    oldFormat = github_integration.gitpanel.sel1SelectedSaveFormat || github_integration.gitpanel.availableSaveFormats[0];
    github_integration.gitpanel.sel1SelectedSaveFormat = format;
  } else {
    oldFormat = github_integration.gitpanel.sel2SelectedSaveFormat || github_integration.gitpanel.availableSaveFormats[0];
    github_integration.gitpanel.sel2SelectedSaveFormat = format;
  }
  if (oldFormat && oldFormat.name != format.name && txt.endsWith(oldFormat.extension)) {
    txt = txt.substring(0, txt.length - oldFormat.extension.length) + format.extension;
    jQuery('#github-save-input').val(txt);
  }
};

github_integration.gitpanel.populateFormatChooser = function(formatChooserID) {
  var defaultFormat = null;
  if (github_integration.gitpanel.scriptToSave.seleniumVersion == builder.selenium1) {
    github_integration.gitpanel.availableSaveFormats = builder.selenium1.adapter.availableFormats();
    defaultFormat = github_integration.gitpanel.sel1SelectedSaveFormat;
  }
  if (github_integration.gitpanel.scriptToSave.seleniumVersion == builder.selenium2) {
    github_integration.gitpanel.availableSaveFormats = builder.selenium2.io.formats;
    defaultFormat = github_integration.gitpanel.sel2SelectedSaveFormat;
  }
  for (var i = 0; i < github_integration.gitpanel.availableSaveFormats.length; i++) {
    if (defaultFormat && github_integration.gitpanel.availableSaveFormats[i].name == defaultFormat.name) {
      jQuery('#' + formatChooserID).append(newNode('option', github_integration.gitpanel.availableSaveFormats[i].name, {'value': i, 'selected': 'selected'}));
    } else {
      jQuery('#' + formatChooserID).append(newNode('option', github_integration.gitpanel.availableSaveFormats[i].name, {'value': i}));
    }
  }
};

github_integration.gitpanel.makeBlobEntry = function(e, parent, blob) {
  return newNode('li', {'style': "padding-left: 12px;"},
    newNode('a', {'href': '#', 'id': 'repo-list-' + blob.id + '-a', 'click': function() {github_integration.gitpanel.openBlobEntry(e, parent, blob);}},
      newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'file.png'), 'id': 'repo-list-' + blob.id + '-file', 'style': "vertical-align: middle;"}),
      newNode('span', {'id': 'repo-list-' + blob.id + '-name'}, blob.name)
    )
  );
};

github_integration.gitpanel.openBlobEntry = function(e, parent, blob) {
  if (github_integration.gitpanel.mode == github_integration.EXPORT) {
    jQuery('#github-save-li').hide();
    jQuery('#github-save-li-format-div-2').remove();
    jQuery('#repo-list-' + blob.id + '-a').after(newNode('div', {'id': 'github-save-li-format-div-2', 'style': "margin-left: 16px;"},
      newNode('select', {
        'id': 'github-save-li-format-chooser-2'
      }),
      newNode('br'),
      newNode('a', {'href': '#', 'class': 'button', 'id': 'github_integration-ok', 'click': function() {
        // Store which format was chosen in the last format chooser, if there is one.
        var format = github_integration.gitpanel.storeAndGetChosenFormat();
        jQuery('#github-save-li-format-div-2').hide();
        github_integration.saveFile(github_integration.gitpanel.scriptToSave, blob.path, e, /*suppressOverwriteWarning*/ true, format);
      }}, _t('ok')),
      newNode('a', {'href': '#', 'class': 'button', 'id': 'github_integration-cancel', 'click': function() {
        jQuery('#github-save-li').show();
        jQuery('#github-save-li-format-div-2').remove();
      }}, _t('cancel'))
    ));
    github_integration.gitpanel.populateFormatChooser('github-save-li-format-chooser-2');
    // Set format to what the suffix suggests by default, if anything.
    for (var i = 0; i < github_integration.gitpanel.availableSaveFormats.length; i++) {
      if (blob.name.endsWith(github_integration.gitpanel.availableSaveFormats[i].extension)) {
        jQuery('#github-save-li-format-chooser-2').val(i);
        break;
      }
    }
  } else if (github_integration.gitpanel.mode == github_integration.SAVE) {
    jQuery('#github-save-li').hide();
    jQuery('#github-save-li-format-div-2').remove();
    github_integration.saveFile(github_integration.gitpanel.scriptToSave, blob.path, e, /*suppressOverwriteWarning*/ true);
  } else if (github_integration.gitpanel.mode == github_integration.SAVE_SUITE || github_integration.gitpanel.mode == github_integration.EXPORT_SUITE) {
    jQuery('#github-save-suite-li').hide();
    jQuery('#github-save-suite-li-format-div-2').remove();
    github_integration.saveSuite(github_integration.gitpanel.suiteToSave, blob.path, e, /*suppressOverwriteWarning*/ true, github_integration.gitpanel.suiteSeleniumVersion);
  } else if (github_integration.gitpanel.mode == github_integration.OPEN || github_integration.gitpanel.mode == github_integration.ADD) {
    // Disassemble path.
    var pathBits = blob.path.split("/");
    var username = pathBits[0];
    var owner = pathBits[1];
    var repo = pathBits[2];
    var branch = pathBits[3];
    var name = pathBits[pathBits.length - 1];
    var inBranchPath = [];
    for (var i = 4; i < pathBits.length; i++) {
      inBranchPath.push(pathBits[i]);
    }
    inBranchPath = inBranchPath.join("/");
    github_integration.send("repos/" + owner + "/" + repo + "/branches/" + branch, function(data) {
      var treeSHA = data.commit.commit.tree.sha;
      github_integration.send("repos/" + owner + "/" + repo + "/git/trees/" + treeSHA + "?recursive=1", function(data) {
        var blobSHA = 0;
        for (var i = 0; i < data.tree.length; i++) {
          if (data.tree[i].path == inBranchPath) {
            blobSHA = data.tree[i].sha;
            break;
          }
        }
        if (!blobSHA) {
          github_integration.gitpanel.reloadRepoEntry(e);
          alert(_t('__github_integration_file_gone', inBranchPath));
          return;
        }
        github_integration.send("repos/" + e.full_name + "/git/blobs/" + blobSHA, function(data) {
          if (data.encoding == 'utf-8') {
            data = data.content;
          } else {
            data = bridge.decodeBase64(data.content.replace(/\n/g, ''));
          }
          data = github_integration.getFileUtils().getUnicodeConverter('UTF-8').ConvertToUnicode(data);
          builder.io.loadUnknownText(data, { 'where': 'github', 'path': blob.path }, github_integration.gitpanel.mode == github_integration.ADD, function(success) {
            github_integration.gitpanel.hide();
          });
        });
      });
    });
  }
};

github_integration.savingFileDialog = null;
github_integration.savingSuiteDialog = null;

github_integration.createScriptRepresentation = function(script, name, format, callback) {
  if (script.seleniumVersion == builder.selenium1) {
    var testCase = builder.selenium1.adapter.convertScriptToTestCase(script);
    testCase.title = name.split(".")[0];
    callback(format.getFormatter().format(testCase, name, '', true));
  }
  if (script.seleniumVersion == builder.selenium2) {
    if (format.get_params) {
      format.get_params(script, function(params) {
        callback(format.format(script, name, params));
      });
    } else {
      callback(format.format(script, name, {}));
    }
  }
};

github_integration.createSuiteRepresentation = function(scripts, path, format, suiteSeleniumVersion, isExport, callback) {
  path = { 'path': path, 'where': 'github' };
  if (suiteSeleniumVersion == builder.selenium1) {
    var ts = new bridge.TestSuite();
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      var tc = builder.selenium1.adapter.convertScriptToTestCase(script);
      var testPath = builder.io.deriveRelativePath(script[isExport ? "exportpath" : "path"], path).path;
      tc.title = testPath.split(".")[0];
      ts.addTestCaseFromContent(tc);
      ts.tests[ts.tests.length - 1].filename = testPath;
    }
    if (format.name == "HTML") {
      callback(ts.formatSuiteTable());
    } else {
      var pathName = path.path.split("/");
      pathName = pathName[pathName.length - 1];
      callback(format.getFormatter().formatSuite(ts, pathName));
    }
  }
  if (suiteSeleniumVersion == builder.selenium2) {
      callback(format.format(scripts, path));
  }
};

github_integration.saveFile = function(script, path, eToReload, suppressOverwriteWarning, format) {
  var mode = github_integration.gitpanel.mode;
  if (github_integration.gitpanel.dialog != null) {
    // Switch to view-only mode to prevent user from doing stupid interleaving things.
    github_integration.gitpanel.mode = github_integration.VIEW;
    jQuery('#github-save-li-ui').hide();
    jQuery('#github-save-li-saving').show();
    jQuery('#repo-list-close').hide();
  } else {
    github_integration.savingFileDialog = newNode('div', {'class': 'dialog'},
      newNode('span', {'id': 'github-saving' }, _t('__github_integration_saving'), newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'spinner.gif'), 'style': "vertical-align: middle;"}))
    );
    builder.dialogs.show(github_integration.savingFileDialog);
  }
  
  // Acquire name.
  var pathBits = path.split("/");
  var name = pathBits[pathBits.length - 1];
  
  format = (mode == github_integration.EXPORT && format) ? format : script.seleniumVersion.io.getSaveFormat();
  
  github_integration.createScriptRepresentation(script, name, format, function(text) {
    github_integration.saveText(script, path, eToReload, suppressOverwriteWarning, format, text, mode);
  });
};

github_integration.saveSuite = function(scripts, path, eToReload, suppressOverwriteWarning, seleniumVersion) {
  var mode = github_integration.gitpanel.mode;
  if (github_integration.gitpanel.dialog != null) {
    // Switch to view-only mode to prevent user from doing stupid interleaving things.
    github_integration.gitpanel.mode = github_integration.VIEW;
    jQuery('#github-save-suite-li-ui').hide();
    jQuery('#github-save-suite-li-saving').show();
    jQuery('#repo-list-close').hide();
  } else {
    github_integration.savingSuiteDialog = newNode('div', {'class': 'dialog'},
      newNode('span', {'id': 'github-saving-suite' }, _t('__github_integration_saving'), newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'spinner.gif'), 'style': "vertical-align: middle;"}))
    );
    builder.dialogs.show(github_integration.savingSuiteDialog);
  }
  
  var isExport = mode == github_integration.EXPORT_SUITE;
  
  var format = isExport ? builder.suite.getCommonExportFormat() : seleniumVersion.io.getSaveSuiteFormat();
  
  github_integration.createSuiteRepresentation(scripts, path, format, seleniumVersion, isExport, function(text) {
    github_integration.saveText(scripts, path, eToReload, suppressOverwriteWarning, format, text, mode);
  });
};

github_integration.saveText = function(scriptOrScripts, path, eToReload, suppressOverwriteWarning, format, txt, saveMode) {
  var isExport = saveMode == github_integration.EXPORT || saveMode == github_integration.EXPORT_SUITE;
  var isSuite = saveMode == github_integration.SAVE_SUITE || saveMode == github_integration.EXPORT_SUITE;
  
  // Disassemble path.
  var pathBits = path.split("/");
  var username = pathBits[0];
  var owner = pathBits[1];
  var repo = pathBits[2];
  var branch = pathBits[3];
  var name = pathBits[pathBits.length - 1];
  var inBranchPath = [];
  for (var i = 4; i < pathBits.length; i++) {
    inBranchPath.push(pathBits[i]);
  }
  inBranchPath = inBranchPath.join("/");
  
  // The user may have switched GitHub credentials since accessing that file, in which case we have
  // to ask them for the password for the account the path specifies.
  var credentials = github_integration.getCredentials();
  if (credentials.username != username) {
    var newPwd = prompt(_t('__github_integration_pwd_prompt', credentials.username));
    if (!newPwd) { return; }
    credentials = { 'username': username, 'password': newPwd };
  }
  
  // Set up convenience functions for talking to GitHub.
  var error = function(jqXHR, textStatus, errorThrown) {
    alert(_t('__github_integration_save_error', errorThrown));
    if (github_integration.gitpanel.dialog != null) {
      github_integration.gitpanel.mode = saveMode;
      if (!isSuite) {
        jQuery('#github-save-li-ui').show();
        jQuery('#github-save-li-saving').hide();
      } else {
        jQuery('#github-save-suite-li-ui').show();
        jQuery('#github-save-suite-li-saving').hide();
      }
      jQuery('#repo-list-close').show();
      if (eToReload) {
        github_integration.gitpanel.reloadRepoEntry(eToReload);
      }
    } else {
      if (!isSuite) {
        jQuery(github_integration.savingFileDialog).remove();
        github_integration.savingFileDialog = null;
      } else {
        jQuery(github_integration.savingSuiteDialog).remove();
        github_integration.savingSuiteDialog = null;
      }
    }
  };
  
  var get = function(path, success) {
    github_integration.send("repos/" + owner + "/" + repo + "/" + path, success, null, credentials, "GET", null, error);
  };
  
  var post = function(path, data, success) {
    github_integration.send("repos/" + owner + "/" + repo + "/" + path, success, null, credentials, "POST", JSON.stringify(data), error);
  };
  
  var patch = function(path, data, success) {
    github_integration.send("repos/" + owner + "/" + repo + "/" + path, success, null, credentials, "PATCH", JSON.stringify(data), error);
  };
  
  // Get the current commit's tree, patch it with the new/updated file, create a commit, and make
  // that commit HEAD of the branch.
  get("branches/" + branch, function(data) {
    var commitSHA = data.commit.sha;
    var treeSHA = data.commit.commit.tree.sha;
    get("git/trees/" + treeSHA + "?recursive=1", function(data) {
      if (!suppressOverwriteWarning) {
        for (var i = 0; i < data.tree.length; i++) {
          if (data.tree[i].path == inBranchPath && !confirm(_t('__github_integration_overwrite_q', inBranchPath))) {
            github_integration.gitpanel.mode = saveMode;
            jQuery('#github-save-li-ui').show();
            jQuery('#github-save-li-saving').hide();
            jQuery('#repo-list-close').show();
            jQuery('#github-save-input').val(name).focus();
            return;
          }
        }
      }
      var treeUpdate = {
        "base_tree": treeSHA,
        "tree": [
          {
            "path": inBranchPath,
            "mode": "100644",
            "type": "blob",
            "content": txt
          }
        ]
      };
      post("git/trees", treeUpdate, function(data) {
        var newTreeSHA = data.sha;
        var commit = {
          "message": "Committed " + name + ".",
          "tree": newTreeSHA,
          "parents": [ commitSHA ]
        };
        post("git/commits", commit, function(data) {
          var newCommitSHA = data.sha;
          var headUpdate = {
            "sha": newCommitSHA
          };
          patch("git/refs/heads/" + branch, headUpdate, function(data) {
            if (!isSuite) {
              scriptOrScripts[isExport ? "exportpath" : "path"] = { 'where': 'github', 'path': path, 'format': format };
              builder.suite.setCurrentScriptSaveRequired(false);
              builder.gui.suite.update();
              jQuery('#github-save-li-saving').hide();
            } else {
              builder.suite[isExport ? "exportpath" : "path"] = { 'where': 'github', 'path': path, 'format': format };
              builder.suite.setSuiteSaveRequired(false);
              builder.gui.suite.update();
              jQuery('#github-save-suite-li-saving').hide();
            }
            if (github_integration.gitpanel.dialog != null) {              
              // Reload the parent in view-only mode to show the newly saved item, then close.
              if (eToReload) {
                github_integration.gitpanel.reloadRepoEntry(eToReload);
                jQuery('#repo-list-close').show();
                github_integration.gitpanel.onReloadCallbackPath = path;
                github_integration.gitpanel.onReloadCallback = function(id) {
                  jQuery('#repo-list-' + id + '-name').css('font-weight', 'bold').css('color', 'black')[0].scrollIntoView(true);
                  github_integration.gitpanel.onReloadCallbackPath = null;
                  setTimeout(github_integration.gitpanel.hide, 500);
                };
              } else {
                github_integration.gitpanel.hide();
              }
            } else {
              if (!isSuite) {
                jQuery(github_integration.savingFileDialog).remove();
                github_integration.savingFileDialog = null;
              } else {
                jQuery(github_integration.savingSuiteDialog).remove();
                github_integration.savingSuiteDialog = null;
              }
            }
          });
        });
      });
    });
  });
};

github_integration.getPaginated = function(path, success, page, allData) {
  if (!page) { page = 1; }
  if (!allData) { allData = []; }
  github_integration.send(path + "?page=" + page, function(data) {
    if (data.length == 0) {
      success(allData);
    } else {
      github_integration.getPaginated(path, success, page + 1, allData.concat(data));
    }
  });
};

github_integration.auth_token = null;
github_integration.auth_token_username = null;

github_integration.send = function(path, success, error, credentials, type, data, errorOverride) {
  credentials = credentials || github_integration.getCredentials();
  if (!github_integration.auth_token || github_integration.auth_token_username != credentials.username) {
    github_integration.auth_token = github_integration.getAuthToken(credentials.username);
    github_integration.auth_token_username = credentials.username;
  }
  var url = "https://api.github.com/" + path;
  if (!type || type == "GET") {
    if (path.indexOf('?') != -1) {
      url += '&nonce=' + Math.random();
    } else {
      url += '?' + Math.random();
    }
  }
  var aj = {
    "type": type || "GET",
    "headers": github_integration.auth_token ? {"Authorization": "token " + github_integration.auth_token } : {"Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password)},
    "url": url,
    "success": success,
    "error": function(jqXHR, textStatus, errorThrown) {
      if (github_integration.auth_token || jqXHR.getAllResponseHeaders().indexOf("X-GitHub-OTP: required") != -1) {
        github_integration.auth_token = null;
        github_integration.auth_token_username = null;
        jQuery.ajax({
          "type": "POST",
          "headers": {"Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password)},
          "url": "https://api.github.com/authorizations",
          "data": JSON.stringify({"note": "SB GitHub Integration"}),
          "success": function(data) {
            github_integration.auth_token_username = credentials.username;
            github_integration.auth_token = data.token;
            github_integration.setAuthToken(credentials.username, data.token);
            github_integration.send(path, success, error, credentials, type, data, errorOverride);
          },
          "error": function(jqXHR, textStatus, errorThrown) {
            var code = prompt(_t("__github_integration_auth_code_prompt"));
            jQuery.ajax({
              "type": "POST",
              "headers": {"X-GitHub-OTP": code, "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password)},
              "url": "https://api.github.com/authorizations",
              "data": JSON.stringify({"note": "Selenium Builder GitHub Integration " + new Date().getTime()}),
              "success": function(data) {
                github_integration.auth_token_username = credentials.username;
                github_integration.auth_token = data.token;
                github_integration.setAuthToken(credentials.username, data.token);
                github_integration.send(path, success, error, credentials, type, data, errorOverride);
              },
              "error": function(jqXHR, textStatus, errorThrown) {
                if (errorOverride) {
                  errorOverride(jqXHR, textStatus, errorThrown);
                } else {
                  if (error) {
                    error(jqXHR, textStatus, errorThrown);
                  }
                  alert(_t('__github_integration_connection_error', errorThrown));
                }
              }
            });
          }
        });
      } else {
        if (errorOverride) {
          errorOverride(jqXHR, textStatus, errorThrown);
        } else {
          if (error) {
            error(jqXHR, textStatus, errorThrown);
          }
          alert(_t('__github_integration_connection_error', errorThrown));
        }
      }
    }
  };
  if (data) { aj.data = data; }
  jQuery.ajax(aj);
};
