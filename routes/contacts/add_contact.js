//initial setup
const express = require('express')
var router = express.Router()
const bodyParser = require("body-parser")
router.use(bodyParser.json())
let pool = require('../utilities/utils').pool

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 

/**
 * @api {post} /contacts Request to add a contact to the user's contact list
 * @apiName PostContacts
 * @apiGroup Contacts
 * 
 * @apiParam {Number} user1Id the userId of the user adding the contact
 * @apiParam {Number} user2Id the userId of the contact to be added
 * 
 * @apiSuccess (Success 200) {boolean} success true when the contact is added
 * 
 * @apiError (400: Duplicate contact) {String} message "Contact already exists"
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiError (400: userId Error) {String} message "Malformed parameter. userId must be a number"
 * 
 * @apiError (400: User userId does not exist) {String} message "Adding User's ID not found"
 * 
 * @apiError (400: Contact userId does not exist) {String} message "Added User's ID not found"
 * 
 * @apiUse JSONError
 */ 
router.post("/", (request, response, next) => {
    // Check for empty parameters
    if (!request.body.user1Id || !request.body.user2Id) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.body.user1Id) || isNaN(request.body.user2Id)) {
        response.status(400).send({
            message: "Malformed parameter. userId must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate userId1 exists
    let query = 'SELECT * FROM MEMBERS WHERE MemberID=$1'
    let values = [request.body.user1Id]

    pool.query(query, values)
        .then(result=> {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Adding User's ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on userId check",
                error: error
            })
        })
}, (request, response, next) => {
    //validate userId2 exists
    let query = 'SELECT * FROM MEMBERS WHERE MemberID=$1'
    let values = [request.body.user2Id]

    pool.query(query, values)
        .then(result=> {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Added User's ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on userId check",
                error: error
            })
        })
}, (request, response, next) => {
    // check for duplicate contact
    let query = 'SELECT * FROM CONTACTS WHERE (MemberID_A=$1 AND MemberID_B=$2) OR (MemberID_A=$2 AND MemberID_B=$1)'
    let values = [request.body.user1Id, request.body.user2Id]

    pool.query(query, values)
        .then(result=> {
            if (result.count > 0) {
                response.status(400).send({
                    message: "Contact already exists",
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on userId check",
                error: error
            })
        })
}, (request, response) => {
    let insert = `INSERT INTO Contacts(MemberID_A, MemberID_B)
                  VALUES ($1, $2)
                  RETURNING *`
    let values = [request.body.user1Id, request.body.user2Id]
    pool.query(insert, values)
        .then(result=> {
            response.send({
                success: true
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })
        })
})