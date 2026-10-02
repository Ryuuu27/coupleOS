// Firebase connection for Couple OS.
// Bundled into firebase-bundle.js so the page does not need a CDN and keeps working offline.
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut
} from "firebase/auth";
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, orderBy, writeBatch
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDm8YkN1qbMIP_-5ExGEAGYUYoUuh0URK8",
  authDomain: "couple-os-7a6af.firebaseapp.com",
  databaseURL: "https://couple-os-7a6af-default-rtdb.firebaseio.com",
  projectId: "couple-os-7a6af",
  storageBucket: "couple-os-7a6af.firebasestorage.app",
  messagingSenderId: "918904043726",
  appId: "1:918904043726:web:f1130103e53486a419f89f",
  measurementId: "G-FXSNQV3TF8"
};

let app, auth, db;

function init() {
  if (app) return;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  try {
    // keeps a copy on the device so the dashboard opens offline and syncs later
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    db = getFirestore(app);
  }
}

// Everything for one couple lives under couples/{uid}
const couple = uid => doc(db, "couples", uid);
const photoMeta = (uid, id) => doc(db, "couples", uid, "photos", id);
const photoFull = (uid, id) => doc(db, "couples", uid, "photoData", id);

window.FB = {
  init,
  onAuth: cb => onAuthStateChanged(auth, cb),
  signUp: (email, pw) => createUserWithEmailAndPassword(auth, email, pw),
  signIn: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
  signOut: () => signOut(auth),

  watchCouple: (uid, cb) => onSnapshot(couple(uid), { includeMetadataChanges: true },
    s => cb({ exists: s.exists(), data: s.data() || {}, fromCache: s.metadata.fromCache }),
    err => cb({ err })),
  patchCouple: (uid, data) => setDoc(couple(uid), data, { merge: true }),

  watchPhotos: (uid, cb) => onSnapshot(query(collection(db, "couples", uid, "photos"), orderBy("t", "desc")),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => cb(null, err)),
  putPhoto: (uid, id, meta, full) => {
    const b = writeBatch(db);
    b.set(photoFull(uid, id), { d: full });
    b.set(photoMeta(uid, id), meta);
    return b.commit();
  },
  getFull: async (uid, id) => { const s = await getDoc(photoFull(uid, id)); return s.exists() ? s.data().d : null; },
  setCaption: (uid, id, c) => updateDoc(photoMeta(uid, id), { c }),
  delPhoto: (uid, id) => {
    const b = writeBatch(db);
    b.delete(photoFull(uid, id));
    b.delete(photoMeta(uid, id));
    return b.commit();
  }
};
