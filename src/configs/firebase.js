import firebase from 'firebase';

const firebaseApp = firebase.initializeApp({
  apiKey: 'AzaSyB_dummy_key_for_local_testing_only_123',
  authDomain: 'dummy.firebaseapp.com',
  databaseURL: 'https://dummy.firebaseio.com',
  projectId: 'dummy-project',
  storageBucket: 'dummy.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
  measurementId: 'G-12345',
});

const db = firebaseApp.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

export { db, auth, storage };
