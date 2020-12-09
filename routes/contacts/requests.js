//initial setup
const express = require('express')
let pool = require('../../utilities/utils').pool

var router = express.Router()
const bodyParser = require("body-parser")
const { prependOnceListener } = require('../../utilities/sql_conn')
const pushyFunctions = require('../../utilities/utils').messaging

router.use(bodyParser.json())


/** CONFIRM a request
 * 
 * Takes a memberId in the params
 * 
 */
router.post('/:memberId', (request, response, next) => {
   // Check for no parameter
   if (!request.params.memberId) {
      response.status(400).send({
          message: "POST Missing required information"
      })
  // Check for bad parameter
  } else if (isNaN(request.params.memberId)) {
      response.status(400).send({
          message: "POST Malformed parameter. memberId must be a number"
      })
  } else {
      let confirmedMemberId = request.params.memberId
      let hostMemberId = request.decoded.memberid

      let query = 'UPDATE CONTACTS SET VERIFIED=1 WHERE MEMBERID_A=$1 AND MEMBERID_B=$2 RETURNING *'
      let values = [confirmedMemberId,hostMemberId]
      pool.query(query,values)
      .then(result => {
        //check if the contact request exists
         if(result.rows.length == 0) {
            return response.status(400).send({
                message: "Contact request does not exist.",
            })
         }

        //get the username of the person that confirmed the contact request
        query = 'SELECT USERNAME FROM MEMBERS WHERE MEMBERID=$1'
        values = [hostMemberId]

        pool.query(query, values) 
        .then(result => {
            const hostUsername = result.rows[0].username
            //send the person that was confirmed a push notification of the 
            //new contact
            query = `SELECT token FROM Push_Token
            WHERE memberid=$1`;
            values = [confirmedMemberId];
            pool.query(query, values)
            .then(result => {
                pushyFunctions.sendConfirmContactToIndividual(result.rows[0].token, hostUsername)
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
        .catch(error => {
            return response.status(400).send({
                message: "SQL Error on retrieving username",
                error: error
            })  
        })
      }).catch(error => {
         response.status(400).send({
            message: "SQL Error ____",
            error: error
         })
      })
   }
})

/** DENY a request
 * 
 * Takes a memberId in the body
 * 
 */
router.delete('/:memberId?', (request, response, next) => {
   // Check for no parameter
   if (!request.params.memberId) {
      response.status(400).send({
          message: "DELETE Missing required information"
      })
  // Check for bad parameter
  } else if (isNaN(request.params.memberId)) {
      response.status(400).send({
          message: "DELETE Malformed parameter. memberId must be a number"
      })
  } else {
      let deniedMemberId = request.params.memberId
      let hostMemberId = request.decoded.memberid

      let query = 'DELETE FROM CONTACTS WHERE MEMBERID_A=$1 AND MEMBERID_B=$2' + 
                     'AND VERIFIED=0 RETURNING *'
      let values = [deniedMemberId,hostMemberId]

      pool.query(query,values)
      .then(result => {

        if(result.rows.length == 0) {
            return response.status(400).send({
                message: "Contact Request does not exist",
            })           
        }

        //send the person that was denied a push notification
        query = `SELECT token FROM Push_Token
        WHERE memberid=$1`;
        values = [deniedMemberId];
        pool.query(query, values)
        .then(result => {
            pushyFunctions.sendDenyContactToIndividual(result.rows[0].token, hostMemberId)
            return response.status(200).send({
                success: true
            })
        })
      }).catch(error => {
         response.status(400).send({
            message: "SQL Error ____",
            error: error
         })
      })
   }
})

/**
 * @api {get} /contacts/requests Get a list of contact requests
 * @apiName GetContactRequests
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiSuccess {Object[]} contactRequests List of contact requests for the user
 * @apiSuccess {String} username Contact request's username
 * @apiSuccess {String} memberid Contact request's username
 *
 * @apiError (400: No requests) {String} message "No contact requests"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get('/', (request, response, next) => {
    
    // Get the user ID's of the members who have requested to be contacts and are not confirmed
    let query = `SELECT Username, MemberID from MEMBERS where MemberID in 
                    (SELECT MemberID_A from Contacts where MemberID_B=$1 and Verified=0)`
    let values = [request.decoded.memberid]

    pool.query(query,values)
    .then(result => {
        response.send({
            contactRequests: result.rows
        })
    })
    .catch(error => {
        response.status(400).send({
            message: "SQL Error",
            error: error
        })
    })
})

module.exports = router;