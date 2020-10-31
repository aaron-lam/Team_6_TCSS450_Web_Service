const express = require('express')

//We use this create the SHA256 hash
const crypto = require("crypto")

//Access the connection to Heroku Database
let pool = require('../../utilities/utils').pool

let getHash = require('../../utilities/utils').getHash

let sendEmail = require('../../utilities/utils').sendEmail

const router = express.Router();

const bodyParser = require("body-parser")
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json())

/**
 * @api {post} /register Request to resgister a user
 * @apiName PostAuth
 * @apiGroup Auth
 *
 * @apiParam {String} first a users first name
 * @apiParam {String} last a users last name
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
    //TODO add userNAME
    var username = req.body.user
    var email = req.body.email
    var password = req.body.password

    if(first && last && username && email && password) {
        let salt = crypto.randomBytes(32).toString("hex")
        let salted_hash = getHash(password, salt)
        
        let verification_code = getHash(email, "hello");

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
        response.status(400).send({
            message: "Missing required information"
        })
    }
})

module.exports = router
