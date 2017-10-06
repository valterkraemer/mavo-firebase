(function () {
  const $ = window.Bliss
  const Mavo = window.Mavo
  const firebase = window.firebase

  Mavo.Backend.register($.Class({
    extends: Mavo.Backend,
    id: 'Firebase',
    constructor: function () {
      this.key = this.mavo.id
      this.db = firebase.database().ref('mavo')

      this.statusChangesCallbacks = []
      this.changesCallbacks = []

      this.defaultPermissions = {
        unauthenticated: getPermissions(this.mavo.element.getAttribute('unauthenticated-permissions')) || ['read', 'login'],
        authenticated: getPermissions(this.mavo.element.getAttribute('authenticated-permissions')) || ['read', 'edit', 'add', 'delete', 'save', 'logout']
      }

      this.permissions.on(this.defaultPermissions.unauthenticated)

      // Firebase auth changes
      firebase.auth().onAuthStateChanged(user => {
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

      firebase.database().ref('.info/connected').on('value', snap => {
        this.statusChangesCallbacks.forEach(callback => callback(snap.val()))
      })
    },

    onChange: function (callback) {
      this.changesCallbacks.push(callback)

      if (this.listeningOnValue) {
        return
      }
      this.listeningOnValue = true

      console.log('onChange')

      this.db.on('value', snapshot => {
        let doc = snapshot.val()

        console.log('doc', doc)

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
          this.rev = 0
          return {}
        }

        this.rev = data._rev
        return data
      })
    },

    store: function (data) {
      // TODO: How about conflicts?

      return this.db.transaction(currentData => {
        let newRev = 0

        if (currentData && currentData._rev) {
          newRev = currentData._rev + 1
        }

        this.rev = newRev

        return Object.assign(data, {
          _rev: newRev
        })
      })
    },

    login: function () {
      return this.ready.then(() => {
        if (this.user) {
          return
        }

        let provider = new firebase.auth.GoogleAuthProvider()

        return firebase.auth().signInWithPopup(provider).catch(error => {
          this.mavo.error('Firebase: ' + error.message)
        })
      })
    },

    logout: function () {
      return firebase.auth().signOut().then(() => {
        // Sign-out successful.
        this.permissions.off(this.defaultPermissions.authenticated).on(this.defaultPermissions.unauthenticated)
      }).catch((error) => {
        this.mavo.error('Firebase: ' + error.message)
      })
    },

    upload: function (file) {
      this.storage = this.storage || firebase.storage().ref('mavo')

      let ref = this.storage.child(`${file.name}-${Date.now()}`)

      return ref.put(file).then(() => {
        return ref.getDownloadURL()
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
      test: value => value === 'firebase'
    }
  }))
})()
