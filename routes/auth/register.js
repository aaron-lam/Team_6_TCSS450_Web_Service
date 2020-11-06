const express = require('express')

//We use this create the SHA256 hash
const crypto = require("crypto")

//Access the connection to Heroku Database
let pool = require('../../utilities/utils').pool

//Utility functions
let getHash = require('../../utilities/utils').getHash
let sendEmail = require('../../utilities/utils').sendEmail

//Verification functions
let validateName = require('../../utilities/validator').validateName
let validateEmail = require('../../utilities/validator').validateEmail
let validatePassword = require('../../utilities/validator').validatePassword

const router = express.Router();

const bodyParser = require("body-parser")
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json())

/**
 * @api {post} /auth Request to resgister a user
 * @apiName PostAuth
 * @apiGroup Auth
 *
 * @apiParam {String} first a users first name
 * @apiParam {String} last a users last name
 * @apiParam {String} user a username
 * @apiParam {String} email a users email *required unique
 * @apiParam {String} password a users password
 *
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {String} email the email of the user inserted
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: Username exists) {String} message "Username exists"
 *
 * @apiError (400: Email exists) {String} message "Email exists"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 */
router.post('/', (req, res) => {
    res.type("application/json")

    //Retrieve data from query params
    var first = req.body.first
    var last = req.body.last
    var username = req.body.user
    var email = req.body.email
    var password = req.body.password

    if(first && last && username && email && password) {

        let inputError = validateInput(first, last, username, email, password);
        if(inputError) {
            return res.status(400).send({
                message: inputError
            })
        }

        let salt = crypto.randomBytes(32).toString("hex")
        let salted_hash = getHash(password, salt)

        let verification_code = getHash(email, process.env.EMAIL_SALT);

        let theQuery = "INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Verification_Code, Salt) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING Email, Verification_Code"
        let values = [first, last, username, email, salted_hash, verification_code, salt]
        pool.query(theQuery, values)
            .then(result => {
                res.status(201).send({
                    success: true,
                    email: result.rows[0].email
                })
                let verification = result.rows[0].verification_code
                sendEmail("team6.tcss450.uw@gmail.com", email, verification, "Welcome!", "<strong>Welcome to our app!</strong>");
            })
            .catch((err) => {
                if (err.constraint == "members_username_key") {
                    res.status(400).send({
                        message: "Username exists"
                    })
                } else if (err.constraint == "members_email_key") {
                    res.status(400).send({
                        message: "Email exists"
                    })
                } else {
                    res.status(400).send({
                        message: err.detail
                    })
                }
            })
    } else {
        res.status(400).send({
            message: "Missing required information"
        })
    }
})

function validateInput(first, last, username, email, password) {

    let firstError = validateName(first, "First Name")
    if(firstError) return firstError

    let lastError = validateName(last, "Last Name")
    if(lastError) return lastError
    
    let userError = validateName(username, "Username")
    if(userError) return userError

    let emailError = validateEmail(email)
    if(emailError) return emailError

    let passwordError = validatePassword(password)
    if(passwordError) return passwordError

}

module.exports = router
