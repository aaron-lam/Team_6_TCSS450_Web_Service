//initial setup
const express = require('express')
let pool = require('../utilities/utils').pool

var router = express.Router()
const bodyParser = require("body-parser")

router.use(bodyParser.json())

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} /contacts Request to add a contact to the user's contact list
 * @apiName PostContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {Number} userId the userId of the contact to be added
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
 * @apiError (400: Contact userId does not exist) {String} message "Added User's ID not found"
 *
 * @apiUse JSONError
 */
router.post("/", (request, response, next) => {
    // Check for empty parameters
    if (!request.body.userId) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.body.userId)) {
        response.status(400).send({
            message: "Malformed parameter. userId must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate userId exists
    let query = 'SELECT * FROM MEMBERS WHERE MemberID=$1'
    let values = [request.body.userId]

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
    let values = [request.decoded.memberid, request.body.userId]

    pool.query(query, values)
        .then(result=> {
            if (result.rowCount > 0) {
                response.status(400).send({
                    message: "Contact already exists",
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
}, (request, response) => {
    let insert = `INSERT INTO Contacts(MemberID_A, MemberID_B)
                  VALUES ($1, $2)
                  RETURNING *`
    let values = [request.decoded.memberid, request.body.userId]
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


/** THIS IS FOR GETTING CONTACT REQUESTS
 * 
 * Returns people who have requested to be contacts that are unconfirmed
 * 
 */
router.get("/requests", (request, response, next) => {
    
    // Get the user ID's of the members who have requested to be contacts and are not confirmed
    let query = 'SELECT MemberID_A FROM CONTACTS WHERE MemberID_B=$1 and verified=0'
    let values = [request.decoded.memberid]

    pool.query(query,values)
    .then(result => {
        
        if (result.rows.length == 0) {
            response.status(400).send({
                message: "No contact requests",
            })
        }

        // build the query with all memberId's
        // Also build the values array
        let query = 'SELECT username, memberid FROM MEMBERS WHERE '
        let values = [];
        for (i = 0; i < result.rows.length; i++) {

            values[i] = result.rows[i].memberid_a
            query += 'MEMBERID=$' + (i+1)

            // if it's not the last one, add syntax for another memberid
            if (i+1 < result.rows.length) {
                query += ' or '
            }
        }

        // Final query
        pool.query(query,values)
        .then(newResult => {
            response.send({contactRequests: newResult.rows})
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on member table request",
                error: error
            })
        })
    }).catch(error => {
        response.status(400).send({
            message: "SQL Error on contacts table request",
            error: error
        })
    })
})

/**
 * @api {get} /contacts/:userId? Request to view a contact
 * @apiName GetContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {Number} userId (Optional) the contact's user ID number.  If no number provided, all are contacts returned
 *
 * @apiSuccess {Object[]} contacts List of confirmed contacts associated with the requester
 * @apiSuccess {String} first requested contact's first name
 * @apiSuccess {String} last requested contact's last name
 * @apiSuccess {String} username requested contact's username
 *
 * @apiError (400: Invalid user) {String} message "User not found"
 *
 * @apiError (400: Not a contact) {String} message "User is not a contact"
 *
 * @apiError (400: Unconfirmed contact) {String} message "Contact is not confirmed"
 *
 * @apiError (400: Empty contact list) {String} message "No contacts exist"
 *
 * @apiError (400: userId Error) {String} message "Malformed parameter. userId must be a number"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get("/:userId?", (request, response, next) => {
    // Empty parameter operation
    if (!request.params.userId) {
        let query = 'SELECT FirstName, LastName, Username, MemberId FROM Members WHERE MemberID IN (SELECT MemberID_B FROM Contacts WHERE MemberID_A=$1 AND Verified=1);'
        let values = [request.decoded.memberid]

        pool.query(query, values)
        .then(result=> {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "No contacts exist",
                })
            } else {
                response.send({
                    contacts: result.rows
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on userId check",
                error: error
            })
        })

    // Checking for bad parameter
    } else if (isNaN(request.params.userId)) {
        response.status(400).send({
            message: "Malformed parameter. userId must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    // Check if contact exists, and confirmation status
    let query = 'SELECT * FROM CONTACTS WHERE MemberID_A=$1 AND MemberID_B=$2'
    let values = [request.decoded.memberid, request.params.userId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "User is not a contact",
                })
            } else if (result.rows[0].verified == 0) {
                response.status(400).send({
                    message: "Contact is not confirmed",
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response) => {
    // Verify requested user exists, if so return request
    let query = 'SELECT * FROM MEMBERS WHERE MemberID=$1'
    let values = [request.params.userId]

    pool.query(query, values)
    .then(result=> {
        if (result.rowCount == 0) {
            response.status(400).send({
                message: "User not found"
            })
        } else {
            response.send({
                first: result.rows[0].firstname,
                last: result.rows[0].lastname,
                username: result.rows[0].username,
                memberId: result.rows[0].memberid
            })
        }
    }).catch(error => {
        response.status(400).send({
            message: "SQL Error on user check",
            error: error
        })
    })
})

/**
 * @api {delete} /contacts/:userId? Request to delete a contact
 * @apiName DeleteContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {Number} userId the contact's user ID number
 *
 * @apiSuccess (Success 200) {boolean} success true when the contact is deleted
 *
 * @apiError (400: Invalid contact) {String} message "User not found"
 *
 * @apiError (400: Unconfirmed contact) {String} message "User is not a contact"
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: userId Error) {String} message "Malformed parameter. userId must be a number"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.delete("/:userId?", (request, response, next) => {
    // Check for no parameter
    if (!request.params.userId) {
        response.status(400).send({
            message: "Missing required information"
        })
    // Check for bad parameter
    } else if (isNaN(request.params.userId)) {
        response.status(400).send({
            message: "Malformed parameter. userId must be a number"
        })
    } else {
        //validate userId exists
        let query = 'SELECT * FROM MEMBERS WHERE MemberID=$1'
        let values = [request.params.userId]

        pool.query(query, values)
            .then(result=> {
                if (result.rowCount == 0) {
                    response.status(400).send({
                        message: "User not found"
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
    }
}, (request, response, next) => {
    // Check if contact exists
    let query = 'SELECT * FROM CONTACTS WHERE MemberID_A=$1 AND MemberID_B=$2'
    let values = [request.decoded.memberid, request.params.userId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "User is not a contact",
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response) => {
    let insert = `DELETE FROM Contacts
                  WHERE MemberID_A=$1
                  AND MemberID_B=$2
                  RETURNING *`
    let values = [request.decoded.memberid, request.params.userId]
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

module.exports = router
