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
m.__github_integration_save_menu = "Save script to GitHub";
m.__github_integration_save = "Save";
m.__github_integration_enter_name = "Please enter a name for the script to save under.";
m.__github_integration_pwd_prompt = "Please enter the GitHub password for user {0}.";
m.__github_integration_saving = "Saving...";

// de
m = builder.translate.locales['de'].mapping;
m.__github_integration_settings = "GitHub Integration Einstellungen";
m.__github_integration_username = "Benutzername";
m.__github_integration_password = "Passwort";
m.__github_integration_connection_error = "Verbindung zu GitHub fehlgeschlagen: {0}";
m.__github_integration_browse = "Skript von GitHub";
m.__github_integration_repos = "Repositorys von {0}";
m.__github_integration_loading = "Lade...";
m.__github_integration_edit_settings = "Einstellungen";
m.__github_integration_reload = "Neu laden";
m.__github_integration_add_from_github = "Skript von GitHub hinzufügen";
m.__github_integration_save_menu = "Skript auf GitHub speichern";
m.__github_integration_save = "Speichern";
m.__github_integration_enter_name = "Bitte geben Sie einen Namen für das Skript an.";
m.__github_integration_pwd_prompt = "GitHub-Passwort für den Benutzer \"{0}\"";
m.__github_integration_saving = "Skript wird gespeichert...";

github_integration.shutdown = function() {
  
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
          newNode('td', newNode('input', {id: 'github_integration-password', type: 'text', value: credentials.password}))
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
  
  builder.gui.menu.addItem('file', _t('__github_integration_save_menu'), 'file-github_integration-save', function() {
    github_integration.gitpanel.scriptToSave = builder.getScript();
    github_integration.gitpanel.show(github_integration.SAVE);
  });
  
  builder.gui.menu.addItem('suite', _t('__github_integration_add_from_github'), 'suite-github_integration_add_from_github', function() {
    github_integration.gitpanel.show(github_integration.ADD);
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
github_integration.VIEW = 3;

github_integration.gitpanel = {};
github_integration.gitpanel.dialog = null;
github_integration.gitpanel.mode = github_integration.OPEN;
github_integration.gitpanel.scriptToSave = null;
github_integration.gitpanel.onReloadCallback = null;
github_integration.gitpanel.onReloadCallbackPath = null;

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
        newNode('span', {'id': 'repo-list-loading', 'style': "float: right;"}, _t('__github_integration_loading'), newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'spinner.gif'), 'style': "vertical-align: middle;"}))
      ),
      newNode('ul', {'id': 'repo-list', 'style': "display: block; overflow: auto; height: 300px; margin-bottom: 8px;"}),
      newNode('a', {'href': '#', 'class': 'button', 'id': 'repo-list-close', 'click': function() {
        github_integration.gitpanel.hide();
      }}, _t('close'))
    );
    builder.dialogs.show(github_integration.gitpanel.dialog);
  }
  github_integration.gitpanel.load(/*reload*/ github_integration.getCredentials().username != github_integration.lastLoadUsername);
};

github_integration.gitpanel.editSettings = function() {
  github_integration.gitpanel.hide();
  github_integration.settingspanel.show(github_integration.gitpanel.show, github_integration.gitpanel.show);
};

github_integration.gitpanel.hide = function() {
  jQuery(github_integration.gitpanel.dialog).remove();
  github_integration.gitpanel.dialog = null;
};

github_integration.gitpanel.load = function(reload) {
  if (github_integration.repos.state == github_integration.LOADED && !reload) {
    github_integration.gitpanel.populateList();
    jQuery('#repo-list-loading').hide();
    jQuery('#repo-list-settings').show();
    jQuery('#repo-list-reload').show();
  } else {
    github_integration.lastLoadUsername = github_integration.getCredentials().username;
    github_integration.repos.state = github_integration.LOADING;
    jQuery('#repo-list-loading').show();
    github_integration.send("user/repos", function(data) {
      github_integration.repos.state = github_integration.LOADED;
      jQuery('#repo-list-loading').hide();
      var username = github_integration.getCredentials().username;
      var l = [];
      github_integration.repos.list = l;
      for (var i = 0; i < data.length; i++) {
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
        return a.name < b.name ? -1 : b.name > a.name ? 1 : 0;
      });
      github_integration.gitpanel.populateList();
      jQuery('#repo-list-loading').hide();
      jQuery('#repo-list-settings').show();
      jQuery('#repo-list-reload').show();
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
        return a.name < b.name ? -1 : b.name > a.name ? 1 : 0;
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
        return a.name < b.name ? -1 : b.name > a.name ? 1 : 0;
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

github_integration.gitpanel.populateTreeEntry = function(e, parent, tree) {
  jQuery('#repo-list-' + tree.id + '-reload').show();
  jQuery('#repo-list-' + tree.id + '-triangle')[0].src = builder.plugins.getResourcePath('github_integration', 'open.png');
  github_integration.openPaths[tree.path] = true;
  jQuery('#repo-list-' + tree.id + '-ul').html('');
  
  if (github_integration.gitpanel.mode == github_integration.SAVE) {
    var txt = jQuery('#github-save-input').val() || github_integration.gitpanel.scriptToSave.seleniumVersion.io.defaultRepresentationExtension;
    var sel = jQuery('#github-save-input')[0] ? jQuery('#github-save-input')[0].selectionStart : 0;
    var selEnd = jQuery('#github-save-input')[0] ? jQuery('#github-save-input')[0].selectionEnd : 0;
    jQuery('#github-save-li').remove();
    jQuery('#repo-list-' + tree.id + '-ul').append(newNode('li', { 'id': 'github-save-li', 'style': "padding-left: 12px;" },
      newNode('span', {'id': 'github-save-li-ui'},
        newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'file.png'), 'id': 'repo-list-saving-file', 'style': "vertical-align: middle;"}),
        newNode('input', { 'id': 'github-save-input', 'type': 'text', 'value': txt || "" }),
        newNode('a', { 'href': '#', 'class': 'button', 'style': "margin-left: 5px;", 'click': function() {
            var txt = jQuery('#github-save-input').val();
            if (!txt) {
              alert(_t('__github_integration_enter_name'));
            } else {
              github_integration.saveFile(github_integration.gitpanel.scriptToSave, tree.path + '/' + txt, e);
            }
          }},
          _t('__github_integration_save')
        )
      ),
      newNode('span', {'id': 'github-save-li-saving', 'style': "display: none;"},
        newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'spinner.gif'), 'id': 'repo-list-saving-spinner', 'style': "vertical-align: middle;"}),
        _t('__github_integration_saving')
      )
    ));
    jQuery('#github-save-input').focus();
    jQuery('#github-save-input')[0].selectionStart = sel;
    jQuery('#github-save-input')[0].selectionEnd = selEnd;
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

github_integration.gitpanel.makeBlobEntry = function(e, parent, blob) {
  return newNode('li', {'style': "padding-left: 12px;"},
    newNode('a', {'href': '#', 'click': function() {github_integration.gitpanel.openBlobEntry(e, parent, blob);}},
      newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'file.png'), 'id': 'repo-list-' + blob.id + '-file', 'style': "vertical-align: middle;"}),
      newNode('span', {'id': 'repo-list-' + blob.id + '-name'}, blob.name)
    )
  );
};

github_integration.gitpanel.openBlobEntry = function(e, parent, blob) {
  if (github_integration.gitpanel.mode == github_integration.SAVE) {
    if (confirm(_t('__github_integration_overwrite_q', blob.path))) {
      github_integration.saveFile(github_integration.gitpanel.scriptToSave, blob.path, e);
    }
  } else if (github_integration.gitpanel.mode == github_integration.OPEN || github_integration.gitpanel.mode == github_integration.ADD) {
    github_integration.send("repos/" + e.full_name + "/git/blobs/" + blob.sha,
      /* success */ function(data) {
        if (data.encoding == 'utf-8') {
          data = data.content;
        } else {
          data = bridge.decodeBase64(data.content.replace(/\n/g, ''));
        }
        if (builder.io.loadUnknownText(data, { 'where': 'github', 'path': blob.path }, null, github_integration.gitpanel.mode == github_integration.ADD)) {
          github_integration.gitpanel.hide();
        }
      }
    );
  }
};

github_integration.saveFile = function(script, path, eToReload) {
  // Switch to view-only mode to prevent user from doing stupid interleaving things.
  github_integration.gitpanel.mode = github_integration.VIEW;
  jQuery('#github-save-li-ui').hide();
  jQuery('#github-save-li-saving').show();
  jQuery('#repo-list-close').hide();
  
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

  // Generate the content to actually upload.
  var txt = script.seleniumVersion.io.getScriptDefaultRepresentation(script, name);
  
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
    github_integration.gitpanel.mode = github_integration.SAVE;
    jQuery('#github-save-li-ui').show();
    jQuery('#github-save-li-saving').hide();
    jQuery('#repo-list-close').show();
  };
  
  var get = function(path, success) {
    github_integration.send("repos/" + owner + "/" + repo + "/" + path, success, error, credentials);
  };
  
  var post = function(path, data, success) {
    github_integration.send("repos/" + owner + "/" + repo + "/" + path, success, error, credentials, "POST", JSON.stringify(data));
  };
  
  var patch = function(path, data, success) {
    github_integration.send("repos/" + owner + "/" + repo + "/" + path, success, error, credentials, "PATCH", JSON.stringify(data));
  };
  
  // Get the current commit's tree, patch it with the new/updated file, create a commit, and make
  // that commit HEAD of the branch.
  get("branches/" + branch, function(data) {
    var commitSHA = data.commit.sha;
    var treeSHA = data.commit.commit.tree.sha;
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
          script.path = { 'where': 'github', 'path': path };
          builder.suite.setCurrentScriptSaveRequired(false);
          builder.gui.suite.update();
          jQuery('#github-save-li-saving').hide();
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
        });
      });
    });
  });
};

github_integration.send = function(path, success, error, credentials, type, data) {
  credentials = credentials || github_integration.getCredentials();
  var aj = {
    "type": type || "GET",
    "headers": {"Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password)},
    "url": "https://api.github.com/" + path + ((!type || type == "GET") ? ("?" + Math.random()) : ""),
    "success": success,
    "error": function(jqXHR, textStatus, errorThrown) {
      if (error) {
        error(jqXHR, textStatus, errorThrown);
      }
      alert(_t('__github_integration_connection_error', errorThrown));
    }
  };
  if (data) { aj.data = data; }
  jQuery.ajax(aj);
};