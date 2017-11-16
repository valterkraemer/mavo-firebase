(function () {
  const $ = window.Bliss
  const Mavo = window.Mavo
  const firebase = window.firebase

  Mavo.Backend.register($.Class({
    extends: Mavo.Backend,
    id: 'Firebase',
    constructor: function (databaseUrl) {
      let id = this.mavo.id || 'mavo'
      let config = {}

      let initUsingAttributes = /^https:\/\/.*\.firebaseio\.com$/.test(databaseUrl)

      // Init Firebase using attributes
      if (initUsingAttributes) {
        config = {
          apiKey: this.mavo.element.getAttribute('mv-firebase-api-key'),
          authDomain: this.mavo.element.getAttribute('mv-firebase-auth-domain'),
          databaseURL: databaseUrl,
          storageBucket: this.mavo.element.getAttribute('mv-firebase-storage-bucket')
        }

        if (!config.apiKey) {
          return this.mavo.error('Firebase: mv-firebase-api-key attribute missing')
        }

        // Support using multiple apps on the same page
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(config)
        } else {
          this.app = firebase.initializeApp(config, `app${firebase.apps.length}`)
        }
      } else {
        // Init firebase using script
        config = firebase.default.app().options

        if (!config.apiKey) {
          return this.mavo.error('Firebase: apiKey missing from config')
        }

        this.app = firebase.default
      }

      this.statusChangesCallbacks = []
      this.changesCallbacks = []

      // PERMISSIONS
      let unauthenticatedPermissionsAttr = this.mavo.element.getAttribute('mv-unauthenticated-permissions')
      let authenticatedPermissionsAttr = this.mavo.element.getAttribute('mv-authenticated-permissions')

      let authenticatedPermissions = getPermissions(authenticatedPermissionsAttr) || ['read', 'edit', 'add', 'delete', 'save', 'logout']

      // Use default permissions if unauthenticated-permissions isn't specified,
      // attribute 'firebase-auth-domain' has to be set if permission 'login' is used
      let unauthenticatedPermissions = getPermissions(unauthenticatedPermissionsAttr)
      if (unauthenticatedPermissions) {
        if (!config.authDomain && unauthenticatedPermissions.includes('login')) {
          if (initUsingAttributes) {
            return this.mavo.error('Firebase: authDomain missing from config (needed if permission \'login\' is specified)')
          } else {
            return this.mavo.error('Firebase: firebase-auth-domain attribute missing (needed if permission \'login\' is specified)')
          }
        }
      } else {
        if (config.authDomain) {
          unauthenticatedPermissions = ['read', 'login']
        } else {
          unauthenticatedPermissions = ['read']
        }
      }

      this.defaultPermissions = {
        authenticated: authenticatedPermissions,
        unauthenticated: unauthenticatedPermissions
      }

      this.permissions.on(this.defaultPermissions.unauthenticated)

      this.db = this.app.database().ref(id)

      // STORAGE

      // Only allow file uploading if storageBucket is defined
      if (config.storageBucket) {
        this.storage = this.app.storage().ref(id)

        this.upload = function (file) {
          let ref = this.storage.child(`${file.name}-${Date.now()}`)

          return ref.put(file).then(() => {
            return ref.getDownloadURL()
          })
        }
      }

      // Firebase auth changes
      this.app.auth().onAuthStateChanged(user => {
        if (!user) {
          return
        }

        this.permissions.off(this.defaultPermissions.unauthenticated).on(this.defaultPermissions.authenticated)
        this.user = {
          username: user.email,
          name: user.displayName,
          avatar: user.photoURL
        }
      }, error => {
        this.mavo.error('Firebase: ' + error.message)
      })

      // HELPER FUNCTIONS

      function getPermissions (attr) {
        if (attr) {
          return attr.split(/\s+/)
        } else if (attr === '') {
          return []
        }
      }
    },

    onStatusChange: function (callback) {
      this.statusChangesCallbacks.push(callback)

      if (this.listeningOnStatus) {
        return
      }
      this.listeningOnStatus = true

      this.app.database().ref('.info/connected').on('value', snap => {
        this.statusChangesCallbacks.forEach(callback => callback(snap.val()))
      })
    },

    onChange: function (callback) {
      this.changesCallbacks.push(callback)

      if (this.listeningOnValue) {
        return
      }
      this.listeningOnValue = true

      this.db.on('value', snapshot => {
        let doc = snapshot.val()

        if (!doc || !doc._rev || doc._rev <= this.rev) {
          return
        }

        this.rev = doc._rev

        this.changesCallbacks.forEach(callback => callback(doc))
      })
    },

    load: function () {
      return this.db.once('value').then(snapshot => {
        let data = snapshot.val()

        if (!data) {
          this.rev = 1
          return {}
        }

        this.rev = data._rev || 1
        return data
      })
    },

    store: function (data) {
      // TODO: How about conflicts?

      return this.db.transaction(currentData => {
        this.rev = (this.rev || 0) + 1

        if (currentData && currentData._rev) {
          this.rev = currentData._rev + 1
        }

        return Object.assign(data, {
          _rev: this.rev
        })
      })
    },

    login: function () {
      return this.ready.then(() => {
        if (this.user) {
          return
        }

        let provider = new this.app.auth.GoogleAuthProvider()

        return this.app.auth().signInWithPopup(provider).catch(error => {
          this.mavo.error('Firebase: ' + error.message)
          return Promise.reject(error)
        })
      })
    },

    logout: function () {
      return this.app.auth().signOut().then(() => {
        // Sign-out successful.
        this.permissions.off(this.defaultPermissions.authenticated).on(this.defaultPermissions.unauthenticated)
      }).catch((error) => {
        this.mavo.error('Firebase: ' + error.message)
      })
    },

    compareDocRevs: function (docA, docB) {
      // If b is newer return 1

      if (!docA || !docA._rev) {
        return 1
      }

      if (!docB || !docB._rev) {
        return -1
      }

      if (docA._rev === docB._rev) {
        return 0
      }

      return docA._rev < docB._rev ? 1 : -1
    },

    static: {
      test: url => /^(firebase|https:\/\/.*\.firebaseio\.com)$/.test(url)
    }
  }))
})()
