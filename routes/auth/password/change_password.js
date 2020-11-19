const express = require('express');

const pool = require('../../../utilities/utils').pool;

//Utility functions
const getHash = require('../../../utilities/utils').getHash;

//Verification functions
const validatePassword = require('../../../utilities/validator').validatePassword;

const router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

/**
 * @api {put} /password Request to change a password
 * @apiName PutPasswordReset
 * @apiGroup Password
 *
 * @apiParam {String} email  a user's email
 * @apiParam {String} password a user's current password
 * @apiParam {String} password a user's new password
 *
 * @apiSuccess (Success 201) {boolean} success true when password is changed
 * @apiSuccess (Success 201) {String} message success message
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: Credentials not match) {String} message "Credentials not match"
 */
router.put('/', (req, res) => {
  res.type("application/json");

  //Retrieve data from query params
  const email = req.body.email;
  const password = req.body.password;
  const newPassword = req.body.newPassword;
  const verificationCode = req.body.verificationCode;

  // new password is a required field,
  // the request can either have email/password or verification code to reset the password.
  if ((email && password || verificationCode) && newPassword) {
    const theQuery = `SELECT Salt, Password, Verification FROM Members WHERE ${email ? "Email" : "verification_code"}=$1`;
    const values = [(email ? email : verificationCode)];
    pool.query(theQuery, values)
      .then(result => {
        if (result.rowCount === 0) {
          res.status(404).send({
            message: 'User not found'
          });
        } else {
          const salt = result.rows[0].salt;
          //Retrieve our copy of the password
          const ourSaltedHash = result.rows[0].password;

          //Combined their password with our salt, then hash
          let theirSaltedHash = getHash(password, salt);
          //Did our salted hash match their salted hash?
          if (ourSaltedHash === theirSaltedHash || verificationCode) {
            const isVerified = result.rows[0].verification;
            // check whether the email is verified or not
            if (!isVerified) {
              res.status(400).send({
                message: 'Email is not verified yet'
              })
            } else {
              // validate the new password meets the requirement
              const validatePasswordErrorMessage = validatePassword(newPassword);
              if (validatePasswordErrorMessage) {
                throw new Error("New " + validatePasswordErrorMessage);
              }
              // set reset password flag to 0
              pool.query(`UPDATE MEMBERS SET ResetPassword=0 WHERE ${email ? "email" : "verification_code"}=$1`, [(email ? email : verificationCode)]);
              const saltedHash = getHash(newPassword, salt);
              const theQuery = `UPDATE MEMBERS SET Password=$2 WHERE ${email ? "email" : "verification_code"}=$1 RETURNING Email`;
              const values = [(email ? email : verificationCode), saltedHash];
              pool.query(theQuery, values)
                .then(() => {
                  //package and send the results
                  res.status(200).json({
                    success: true,
                    message: 'Changed password successful!'
                  })
                })
            }
          } else {
            throw new Error("Credentials did not match");
          }
        }
      })
      .catch((err) => {
        res.status(400).send({
          success: false,
          message: err.message
        })
      })
  } else {
    res.status(400).send({
      success: false,
      message: "Missing required information"
    })
  }
});

module.exports = router;
