// config.js
import { auth, db } from "/firebase-init.js";
import {
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

export { auth, db };
setPersistence(auth, browserLocalPersistence);
