//initial setup
const express = require('express')
let pool = require('../../utilities/utils').pool

var router = express.Router()
const bodyParser = require("body-parser")

router.use(bodyParser.json())

// Add a new contact request
router.post('/', (request, response, next) => {

    // These will hold the memberId's of the two members involved
    let userToAdd = null
    let userThatsAdding = request.decoded.memberid

    // Check that the username is correctly inputted
    if (!request.body.username) {
        response.status(400).send({
            message: "Missing required information",
        })
    }

    // Get the memberid for the username given. Also making sure it exists
    let query = `SELECT MEMBERID
                 FROM MEMBERS
                 WHERE USERNAME=$1`
    let values = [request.body.username]

    // First query
    pool.query(query,values)
    .then(result => {

        // If there are no results, the username doesn't exist in the system.
        if (result.rows.length == 0) {
            response.status(400).send({
                message: "Username does not exist.",
            })
        } else {
            userToAdd = result.rows[0].memberid // get the userid
        }

        // This catches the user trying to add themselves as a contact
        if (userToAdd == userThatsAdding) {
            response.status(400).send({
                message: "User is attempting to add themself.",
            })
        }

        // Next, make sure they're not already contacts with this person.
        query = `SELECT * 
                    FROM CONTACTS 
                    WHERE MEMBERID_A=$1 AND MEMBERID_B=$2 AND VERIFIED=1 
                    OR MEMBERID_A=$2 AND MEMBERID_B=$1 AND VERIFIED=1`
        values = [userThatsAdding,userToAdd]

        // Second query
        pool.query(query,values)
        .then(result => {

            // If you get any rows in response, they're already contacts. Send an error.
            if (result.rows.length > 0) {
                response.status(400).send({
                    message: "You are already contacts with this person.",
                })
            }
            
            // Next, check if they've already sent a request, or have a request open from
            // this person that they haven't responded to.
            query = 'SELECT * FROM CONTACTS WHERE (MEMBERID_A=$1 AND MEMBERID_B=$2 AND VERIFIED=0) OR (MEMBERID_A=$2 AND MEMBERID_B=$1 AND VERIFIED=0)'
            values = [userThatsAdding,userToAdd]
    
            // Third query
            pool.query(query,values)
            .then(result => {

                // This means either they've already sent a request, or they have a request
                // they haven't responded to from the person they're trying to add
                if (result.rows.length > 0) {
                    if (result.rows[0].memberid_a == userThatsAdding) {
                        response.status(400).send({
                            message: "You already sent a request to this person and they have not responded.",
                        })
                    } else {
                        response.status(400).send({
                            message: "You have an open request from this person. Simply accept it to add them as a contact.",
                        })
                    }
                }
    
                // Finally, if you've made it this far, add the contact request
                query = `INSERT INTO CONTACTS (MEMBERID_A,MEMBERID_B,VERIFIED)
                         VALUES ($1,$2,0)`
                
                // final query
                pool.query(query,values)
                .then(result => {
                    response.send({
                        success: true
                     })
                }).catch(error => {
                    response.status(400).send({
                        message: "SQL Error on final query",
                        error: error
                    })
                })
            }).catch(error => {
                response.status(400).send({
                    message: "SQL Error on third query",
                    error: error
                })
            })
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on second query",
                error: error
            })
        })
    }).catch(error => {
        response.status(400).send({
            message: "SQL Error on first query",
            error: error
        })
    })
})

/**
 * @api {get} /contacts/:memberId? Request to view a contact
 * @apiName GetContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {Number} memberId (Optional) the contact's user ID number.  If no number provided, all are contacts returned
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
 * @apiError (400: memberId Error) {String} message "Malformed parameter. memberId must be a number"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get('/:memberId?', (request, response, next) => {
    // Empty parameter operation
    if (!request.params.memberId) {
        let query = 
        `SELECT FirstName, LastName, Username, MemberId 
        FROM Members 
        WHERE MemberID 
        IN 
        ((SELECT MemberID_B FROM Contacts WHERE (MemberID_A=$1 AND Verified=1)) 
        UNION ALL
        (SELECT MemberID_A FROM Contacts WHERE (MemberID_B=$1 AND Verified=1)))`
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
                message: "SQL Error on memberId check",
                error: error
            })
        })

    // Checking for bad parameter
    } else if (isNaN(request.params.memberId)) {
        response.status(400).send({
            message: "LISTGET Malformed parameter. memberId must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    // Check if contact exists, and confirmation status
    let query = 'SELECT * FROM CONTACTS WHERE (MemberID_A=$1 AND MemberID_B=$2 AND VERIFIED=1) OR (MemberID_A=$2 AND MemberID_B=$1 AND VERIFIED=1)'
    let values = [request.decoded.memberid, request.params.memberId]

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
    // Verify requested user exists, if so return request
    let query = 'SELECT * FROM MEMBERS WHERE MemberID=$1'
    let values = [request.params.memberId]

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
 * @api {delete} /contacts/:memberId? Request to delete a contact
 * @apiName DeleteContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {Number} memberId the contact's user ID number
 *
 * @apiSuccess (Success 200) {boolean} success true when the contact is deleted
 *
 * @apiError (400: Invalid contact) {String} message "User not found"
 *
 * @apiError (400: Unconfirmed contact) {String} message "User is not a contact"
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: memberId Error) {String} message "Malformed parameter. memberId must be a number"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.delete('/:memberId?', (request, response, next) => {
    // Check for no parameter
    if (!request.params.memberId) {
        response.status(400).send({
            message: "Missing required information"
        })
    // Check for bad parameter
    } else if (isNaN(request.params.memberId)) {
        response.status(400).send({
            message: "Malformed parameter. memberId must be a number"
        })
    } else {
        //validate memberId exists
        let query = 'SELECT * FROM MEMBERS WHERE MemberID=$1'
        let values = [request.params.memberId]

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
                    message: "SQL Error on memberId check",
                    error: error
                })
            })
    }
}, (request, response, next) => {
    // Check if contact exists
    let query = 'SELECT * FROM CONTACTS WHERE (MemberID_A=$1 AND MemberID_B=$2) OR (MemberID_A=$2 AND MemberID_B=$1)'
    let values = [request.decoded.memberid, request.params.memberId]

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
    let values = [request.decoded.memberid, request.params.memberId]
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
