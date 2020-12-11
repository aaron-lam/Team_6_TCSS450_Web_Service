//initial setup
const express = require('express')
let pool = require('../../utilities/utils').pool

var router = express.Router()
const bodyParser = require("body-parser")
const pushyFunctions = require('../../utilities/utils').messaging

router.use(bodyParser.json())

/**
 * @api {post} /contacts Request to add a contact to the user's contact list
 * @apiName PostContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {Number} memberId username the contact's user ID number.
 *
 * @apiSuccess (Success 200) {boolean} success true when the contact is added
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: Invalid user) {String} message "User does not exist."
 *
 * @apiError (400: Add themselves as contact) {String} message "User is attempting to add themself."
 *
 * @apiError (400: Is contact already) {String} message "You are already contacts with this person."
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.post('/', (request, response, next) => {

    // These will hold the memberId's of the two members involved
    response.locals.usertoAdd = null
    response.locals.userThatsAdding = request.decoded.memberid

    // Check that the username is correctly inputted
    if (!request.body.username) {
        response.status(400).send({
            message: "Missing required information",
        })
    } else {
        next()
    }
}, (request, response, next) => {

    // Get the memberid for the username given. Also making sure it exists
    let query = `SELECT MEMBERID
                 FROM MEMBERS
                 WHERE USERNAME=$1`
    let values = [request.body.username]

    pool.query(query,values)
    .then(result => {

        // If there are no results, the username doesn't exist in the system.
        if (result.rows.length == 0) {
            response.status(400).send({
                message: "Username does not exist.",
            })
        } else {
            response.locals.userToAdd = result.rows[0].memberid // get the userid

            // This catches the user trying to add themselves as a contact
            if (response.locals.userToAdd == response.locals.userThatsAdding) {
                response.status(400).send({
                    message: "User is attempting to add themself.",
                })
            } else{
                next()
            }
        }
    }).catch(error => {
        response.status(400).send({
          message: "SQL Error",
          error: error
        })
    })
}, (request, response, next) => {

    // Next, make sure they're not already contacts with this person.
    let query = `SELECT * 
    FROM CONTACTS 
    WHERE MEMBERID_A=$1 AND MEMBERID_B=$2 AND VERIFIED=1 
    OR MEMBERID_A=$2 AND MEMBERID_B=$1 AND VERIFIED=1`
    let values = [response.locals.userThatsAdding,response.locals.userToAdd]

    // Second query
    pool.query(query,values)
    .then(result => {
        // If you get any rows in response, they're already contacts. Send an error.
        if (result.rows.length > 0) {
            response.status(400).send({
                message: "You are already contacts with this person.",
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
}, (request, response, next) => {

    // Next, check if they've already sent a request, or have a request open from
    // this person that they haven't responded to.
    let query = 'SELECT * FROM CONTACTS WHERE (MEMBERID_A=$1 AND MEMBERID_B=$2 AND VERIFIED=0) OR (MEMBERID_A=$2 AND MEMBERID_B=$1 AND VERIFIED=0)'
    let values = [response.locals.userThatsAdding,response.locals.userToAdd]

    // Third query
    pool.query(query,values)
    .then(result => {

        // This means either they've already sent a request, or they have a request
        // they haven't responded to from the person they're trying to add
        if (result.rows.length > 0) {
            if (result.rows[0].memberid_a == response.locals.userThatsAdding) {
                response.status(400).send({
                    message: "You already sent a request to this person and they have not responded.",
                })
            } else if (result.rows[0].member_b == response.locals.userThatsAdding) {
                response.status(400).send({
                    message: "You have an open request from this person. Simply accept it to add them as a contact.",
                })
            } else {
                next()
            }
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

    // Finally, if you've made it this far, add the contact request
    let query = `INSERT INTO CONTACTS (MEMBERID_A,MEMBERID_B,VERIFIED)
    VALUES ($1,$2,0)`

    let values = [response.locals.userThatsAdding,response.locals.userToAdd]

    // final query
    pool.query(query,values)
    .then(result => {

        //get the username of the person that's creating the contact request
        query = 'SELECT USERNAME FROM MEMBERS WHERE MEMBERID=$1'
        values = [response.locals.userThatsAdding]

        pool.query(query, values)
        .then(result => {
            const userAddingUsername = result.rows[0].username
            //send the person being added a push notification
            //of the contact request
            query = `SELECT token FROM Push_Token WHERE MemberID=$1`;
            values = [response.locals.userToAdd];
            pool.query(query, values)
            .then(result => {
                pushyFunctions.sendNewContactToIndividual(result.rows[0].token,
                    userAddingUsername)
                return response.status(200).send({
                    success: true
                })
            })
            .catch(error => {
                return response.status(400).send({
                    message: "SQL Error on retrieving PUSHY token",
                    error: error
                })
            })
        })

    }).catch(error => {
        response.status(400).send({
          message: "SQL Error",
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
 * @apiParam {String} username (Optional) The username of a user that the user wants to potentially add as a contact
 *
 * @apiSuccess {Object[]} contacts List of confirmed contacts associated with the requester
 * 
 * @apiSuccess {boolean} Sends "true" if the contact could potentially be added if the user wishes
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
router.get('/:username?', (request, response, next) => {
    // Empty parameter operation
    if (!request.params.username) {
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
    } else {
        next()
    }
}, (request, response, next) => {

    // Convert the username to a memberId so you can check it's status in the contacts table
    let query = "SELECT MEMBERID FROM MEMBERS WHERE USERNAME=$1"
    let values = [request.params.username]

    pool.query(query, values)
    .then(result => {
        if (result.rowCount == 0) {
            response.status(400).send({
                message: "Username not found"
            })
        } else {
            response.locals.memberid = result.rows[0].memberid
            next()
        }
    })
}, (request, response) => {

    // Check if you're already contacts or have an open contact request. If you are, throw error, if not then send a success result
    let query = 'SELECT * FROM CONTACTS WHERE (MemberID_A=$1 AND MemberID_B=$2) OR (MemberID_A=$2 AND MemberID_B=$1)'
    let values = [request.decoded.memberid, response.locals.memberid]

    pool.query(query, values)
    .then(result => {
        if (result.rowCount != 0) {
            if (result.rows[0].verified == 1) {
                response.status(400).send({
                    message: "User is already a contact",
                })
            } else {
                response.status(400).send({
                    message: "There is already an open contact request with this person",
                })
            }
        } else {
            response.send({
                result: true
            })
        }
    }).catch(error => {
        response.status(400).send({
            message: "SQL Error",
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
router.delete('/:memberId', (request, response, next) => {
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
                message: "SQL Error On Checking Contacts",
                error: error
            })
        })
}, (request, response) => {

    let insert = `DELETE FROM Contacts
                  WHERE (MemberID_A=$1 AND MemberID_B=$2) OR 
                  (MemberID_A=$2 AND MemberID_B=$1)
                  RETURNING *`
    let values = [request.decoded.memberid, request.params.memberId]
    pool.query(insert, values)
        .then(result=> {
            //send pushy notification to the user that was deleted
            let query = `SELECT token FROM Push_Token WHERE MemberID=$1`;
            values = [request.params.memberId];
            pool.query(query, values)
            .then(result => {
                pushyFunctions.sendDeleteContactToIndividual(result.rows[0].token, request.decoded.memberid)
                return response.send({
                    success: true
                })
            }).catch(error => {
                return response.status(400).send({
                    message: "SQL Error on retrieving PUSHY token",
                    error: error
                })
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error On Deleting Contact",
                error: err
            })
        })
})

module.exports = router
