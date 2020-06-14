const Firestore = require('@google-cloud/firestore');
const path = require('path');

class FirestoreClient {
  constructor() {
    this.firestore = new Firestore({
      projectId: 'vigapoker',
      keyFilename: path.join(__dirname, './service-account.json')
    })
  }

  async save(collection, data) {
    const docRef = this.firestore.collection(collection).doc(data.docName);
    await docRef.set(data);
  }

  async update(collection, data) {
    const docRef = this.firestore.collection(collection).doc(data.docName);
    await docRef.update(data);
  }
}

module.exports = new FirestoreClient();