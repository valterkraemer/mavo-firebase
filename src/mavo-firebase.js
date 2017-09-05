(function() {
  var $ = window.Bliss;
  var Mavo = window.Mavo;

  Mavo.Backend.register($.Class({
    extends: Mavo.Backend,
    id: 'Firebase',
    constructor: function() {
      this.key = this.mavo.id;
      this.db = firebase.database().ref('mavo');
      this.storage = firebase.storage().ref('mavo');

      this.fbPermissions = {
        default: ['read', 'login'],
        authenticated: ['read', 'edit', 'add', 'delete', 'save', 'logout']
      };

      var defaultPermissions = this.mavo.element.getAttribute('firebase-default-permissions');
      if (defaultPermissions) {
        this.fbPermissions.default = defaultPermissions.split(/\s+/);
      } else if (defaultPermissions === '') {
        this.fbPermissions.default = [];
      }

      var authPermissions = this.mavo.element.getAttribute('firebase-authenticated-permissions');
      if (authPermissions) {
        this.fbPermissions.authenticated = authPermissions.split(/\s+/);
      } else if (authPermissions === '') {
        this.fbPermissions.authenticated = [];
      }

      this.permissions.on(this.fbPermissions.default);
      this.storeIds = new Set();

      // Localstorage changes
      window.addEventListener('storage', e => {
        if (e.key !== this.key) {
          return;
        }

        var newValue = parseJSON(e.newValue);
        this.updateView(newValue, true);
      });

      // Firebase changes
      this.db.on('value', (snapshot) => {
        this.updateView(snapshot.val());
      });

      // Firebase auth changes
      firebase.auth().onAuthStateChanged(user => {
        if (!user) {
          return;
        }

        this.permissions.off(this.fbPermissions.default).on(this.fbPermissions.authenticated);
        this.user = {
          username: user.email,
          name: user.displayName,
          avatar: user.photoURL
        };

      }, error => {
        this.mavo.error('Firebase: ' + error.message);
      });
    },

    load: function() {
      var newValue = parseJSON(localStorage[this.key]);

      if (newValue && newValue.storeId) {
        this.storeIds.add(newValue.storeId);

        // Send to server
        this.put(newValue);
      }

      return Promise.resolve(newValue);
    },

    store: function(data) {
      // Prevent render to fire store
      if (!this.mavo.unsavedChanges) {
        return Promise.resolve();
      }

      var storeId = Date.now() + '-' + Math.floor((Math.random() * 100000));
      this.storeIds.add(storeId);
      data.storeId = storeId;

      // Put to localstorage
      this.putLocalStorage(data);

      return this.put(data)
        .catch((err) => this.mavo.error('Firebase: ' + err.message));
    },

    put: function(data) {
      if (!data || !data.storeId) {
        return Promise.reject(new Error('No put data or storeId'));
      }

      return this.db.transaction((currentData) => {
        if (!currentData || !currentData.storeId) {
          return data;
        }

        // Ignore if it's the same item (can happen when gotten from localStorage)
        if (data.storeId === currentData.storeId) {
          return;
        }

        if (this.storeIds.has(currentData.storeId)) {
          return data;
        }

        if (confirm('Overwrite server with local data')) {
          return data;
        }

        this.updateView(currentData);
        return;
      });
    },

    putLocalStorage: function(data) {
      localStorage[this.key] = JSON.stringify(data);
    },

    login: function() {
      return this.ready.then(() => {
        if (this.user) {
          return;
        }

        var provider = new firebase.auth.GoogleAuthProvider();

        return firebase.auth().signInWithPopup(provider).catch(error => {
          this.mavo.error('Firebase: ' + error.message);
        });
      });
    },

    logout: function() {
      firebase.auth().signOut().then(() => {
        // Sign-out successful.
        this.permissions.off(this.fbPermissions.authenticated).on(this.fbPermissions.default);

      }).catch((error) => {
        this.mavo.error('Firebase: ' + error.message);
      });
    },

    updateView: function(data, ignoreLocalStorage) {
      if (data && data.storeId) {
        if (this.storeIds.has(data.storeId)) {
          return;
        }

        this.storeIds.add(data.storeId);
      }

      if (!ignoreLocalStorage) {
        this.putLocalStorage(data);
      }

      this.mavo.render(data);
      this.mavo.setUnsavedChanges(false);
    },

    upload: function(file) {
      var ref = this.storage.child(`${file.name}-${Date.now()}`);

      return ref.put(file).then(() => {
        return ref.getDownloadURL();
      });
    },

    static: {
      test: value => value == 'firebase'
    }
  }));

  function parseJSON(obj) {
    try {
      return JSON.parse(obj);
    } catch(e) {
      // Avoid no-empty lint error
    }
  }

})();
