// config.js
import { auth, db } from "/firebase-init.js";
import {
  setPersistence,
  browserLocalPersistence,
} from "/node_modules/firebase/firebase-auth.js";

export { auth, db };
setPersistence(auth, browserLocalPersistence);
