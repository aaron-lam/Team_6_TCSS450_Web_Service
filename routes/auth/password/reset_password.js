const express = require('express');

const pool = require('../../../utilities/utils').pool;

const router = express.Router();

const { sendEmail } = require("../../../utilities/utils");

/**
 * @api {put} /password/reset Request to reset a password
 * @apiName GetPasswordReset
 * @apiGroup Password
 *
 * @apiParam {String} email  a users email
 *
 * @apiSuccess (Success 201) {boolean} success true when the reset password url is sent
 * @apiSuccess (Success 201) {String} email the email of the account that need to reset password
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: Email not exists) {String} message "Email not exists"
 */
router.put('/', (req, res) => {
  const email = req.body.email;
  if (email) {
    const theQuery = "SELECT Verification_Code, Verification FROM Members WHERE Email=$1";
    const values = [email];
    pool.query(theQuery, values)
      .then(result => {
        if (result.rows.length === 0) {
          res.status(404).send({
            success: false,
            message: "Email does not exist"
          });
        } else if (!result.rows[0].verification) {
          res.status(400).send({
            success: false,
            message: "Email is not verified yet"
          })
        } else {
          // set reset password flag to 1
          let theQuery = "UPDATE MEMBERS SET ResetPassword=1 WHERE Email=$1";
          pool.query(theQuery, [email]);
          // send success response
          const verification = result.rows[0].verification_code;
          res.status(201).send({
            success: true,
            email
          });
          sendEmail(
            "team6.tcss450.uw@gmail.com",
            email,
            "Welcome!",
            `<b>Hey there! Click this link to reset your password: </b> <br> https://team6-tcss450-web-service.herokuapp.com/password/reset/${verification}<br/>`
          );
        }
      })
      .catch((err) => {
        res.status(400).send({
          success: false,
          message: err.detail
        })
      })
  } else {
    res.status(400).send({
      success: false,
      message: "Missing required information"
    })
  }
});

/**
 * @api {get} /password/reset/:verification Request to render "reset password" web page
 * @apiName GetPasswordResetVerification
 * @apiGroup Password
 *
 * @apiSuccess (Success 202) {boolean} success true when the verification code is valid
 *
 * @apiError (404: Verification code not found) {String} message "The reset password URL is invalid"
 */
router.get('/:verification', (req, res) => {
  const theQuery = "SELECT Email, ResetPassword FROM Members WHERE Verification_Code=$1";
  const values = [req.params.verification];
  pool.query(theQuery, values)
    .then(result => {
        res.statusCode = 202;
        res.setHeader('Content-Type', 'text/html');
        const htmlFilePath = result.rows.length !== 0 && result.rows[0].resetpassword === 1
          ? 'views/reset_password.html'
          : 'views/reset_password_invalid.html';
          res.sendFile(htmlFilePath, { root: '.' });
    })
    .catch((err) => {
      res.status(400).send({
        message: err.detail
      })
    })
});

module.exports = router;
