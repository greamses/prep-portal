/**
 * USERNAME ACCOUNTS. A student with no email address signs up with a username and their teacher's code
 * (routes/auth.js username-signup); the login is <username>@prepportal.com.ng and the server marks the account
 * with the custom claim `ppUser: true` when it makes it.
 *
 * Anybody could still call Firebase directly and make an account on that domain WITHOUT a teacher's code. Such an
 * account has no mark, so: the server refuses it (middleware/auth.js), the session cookie is refused and the
 * account deleted (routes/auth.js /session), and the database rules treat it as not signed in (firestore.rules
 * isLoggedIn). It can do nothing at all.
 */
const admin = require("firebase-admin");

const DOMAIN = "prepportal.com.ng";
const onDomain = (email) => typeof email === "string" && email.toLowerCase().endsWith("@" + DOMAIN);
/** A decoded token for an account on our login domain that the server did not make. */
const unmarked = (decoded) => !!decoded && onDomain(decoded.email) && decoded.ppUser !== true;
/** Delete such an account (quietly: it may already be gone). */
const removeUnmarked = (decoded) => admin.auth().deleteUser(decoded.uid).catch(() => {});

module.exports = { DOMAIN, onDomain, unmarked, removeUnmarked };
