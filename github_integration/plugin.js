// Init namespace.
var github_integration = {};

// Strings
// en-US
var m = builder.translate.locales['en-US'].mapping;
m.__github_integration_settings = "GitHub Integration Settings";
m.__github_integration_username = "Username";
m.__github_integration_password = "Password";
m.__github_integration_connection_error = "Unable to connect to GitHub: {0}";
m.__github_integration_browse = "Browse GitHub";
m.__github_integration_repos = "{0}'s Repositories";
m.__github_integration_loading = "Loading...";
// de
m = builder.translate.locales['de'].mapping;
m.__github_integration_settings = "GitHub Integration Einstellungen";
m.__github_integration_username = "Benutzername";
m.__github_integration_password = "Passwort";
m.__github_integration_connection_error = "Verbindung zu GitHub fehlgeschlagen: {0}";
m.__github_integration_browse = "Skript von GitHub";
m.__github_integration_repos = "Repositorys von {0}";
m.__github_integration_loading = "Lade...";


github_integration.shutdown = function() {

};

github_integration.getCredentials = function() {
  return {
    username:
      (bridge.prefManager.prefHasUserValue("extensions.seleniumbuilder.plugins.github_integration.username") ? bridge.prefManager.getCharPref("extensions.seleniumbuilder.plugins.github_integration.username") : ""),
    password:
      (bridge.prefManager.prefHasUserValue("extensions.seleniumbuilder.plugins.github_integration.password") ? bridge.prefManager.getCharPref("extensions.seleniumbuilder.plugins.github_integration.password") : "")
  };
};

github_integration.setCredentials = function(username, password) {
  bridge.prefManager.setCharPref("extensions.seleniumbuilder.plugins.github_integration.username", username);
  bridge.prefManager.setCharPref("extensions.seleniumbuilder.plugins.github_integration.password", password);
};


github_integration.settingspanel = {};
/** The dialog. */
github_integration.settingspanel.dialog = null;

github_integration.settingspanel.show = function(callback) {
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
      }}, _t('cancel'))
    );
  builder.dialogs.show(github_integration.settingspanel.dialog);
};

github_integration.settingspanel.hide = function() {
  jQuery(github_integration.settingspanel.dialog).remove();
  github_integration.settingspanel.dialog = null;
};

builder.gui.menu.addItem('file', _t('__github_integration_settings'), 'file-github_integration-settings', github_integration.settingspanel.show);

github_integration.UNLOADED  = 0;
github_integration.LOADING   = 1;
github_integration.LOADED    = 2;

github_integration.repos = {"state": github_integration.UNLOADED, "list": []};

github_integration.gitpanel = {};
github_integration.gitpanel.dialog = null;
github_integration.gitpanel.show = function() {
  var credentials = github_integration.getCredentials();
  if (!credentials.username || !credentials.password) {
    github_integration.settingspanel.show(github_integration.gitpanel.doShow);
  } else {
    github_integration.gitpanel.doShow();
  }
};

github_integration.gitpanel.doShow = function() {
  if (github_integration.gitpanel.dialog === null) {
    github_integration.gitpanel.dialog = newNode('div', {'class': 'dialog'},
      newNode('h3', _t('__github_integration_repos', github_integration.getCredentials().username)),
      newNode('div', {'id': 'repo-list-loading'}, _t('__github_integration_loading'), newNode('img', {'src': "img/loading.gif"})),
      newNode('ul', {'id': 'repo-list'}),
      newNode('a', {'href': '#', 'class': 'button', 'id': 'repo-list-close', 'click': function() {
        github_integration.gitpanel.hide();
      }}, _t('close'))
    );
    builder.dialogs.show(github_integration.gitpanel.dialog);
  }
  github_integration.gitpanel.load(false);
};

github_integration.gitpanel.hide = function() {
  jQuery(github_integration.gitpanel.dialog).remove();
  github_integration.gitpanel.dialog = null;
};

github_integration.gitpanel.load = function(reload) {
  if (github_integration.repos.state == github_integration.LOADED && !reload) {
    github_integration.gitpanel.populateList();
  } else {
    github_integration.repos.state = github_integration.LOADING;
    jQuery('#repo-list-loading').show();
    github_integration.send("user/repos", function(data) {
      github_integration.repos.state = github_integration.LOADED;
      jQuery('#repo-list-loading').hide();
      //dump(JSON.stringify(data));
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
          'tree': null
        });
      }
      github_integration.gitpanel.populateList();
    },
    /*error*/ function(jqXHR, textStatus, errorThrown) {
      alert(_t('__github_integration_connection_error', errorThrown));
      github_integration.repos.state = github_integration.UNLOADED;
      github_integration.gitpanel.hide();
    });
  }
};

github_integration.gitpanel.populateList = function() {
  jQuery('#repo-list').html('');
  for (var i = 0; i < github_integration.repos.list.length; i++) {
    jQuery('#repo-list').append(github_integration.gitpanel.makeRepoEntry(github_integration.repos.list[i]));
  }
};

github_integration.gitpanel.makeRepoEntry = function(e) {
  return newNode('li',
    newNode('a', {'href': '#', 'click': function() {github_integration.gitpanel.toggleRepoEntry(e.id, e.full_name);}},
      newNode('img', {'src': builder.plugins.getResourcePath('github_integration', 'closed.png'), 'id': 'repo-list-' + e.id + '-triangle'}),
      e.name
    ),
    newNode('ul', {'id': 'repo-list-' + e.id + '-ul'})
  );
};

github_integration.gitpanel.toggleRepoEntry = function(id, full_name) {
  jQuery('#repo-list-' + id + '-triangle')[0].src = builder.plugins.getResourcePath('github_integration', 'open.png');
};

github_integration.send = function(path, success, error) {
  var credentials = github_integration.getCredentials();
  jQuery.ajax({
    "headers": {"Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password)},
    "url": "https://api.github.com/" + path,
    "success": success,
    "error": function(jqXHR, textStatus, errorThrown) {
      if (error) {
        error(jqXHR, textStatus, errorThrown);
      } else {
        alert(_t('__github_integration_connection_error', errorThrown));
      }
    }
  });
};

builder.gui.addStartupEntry(_t('__github_integration_browse'), 'startup-browse-github', function() { github_integration.gitpanel.show(); });

