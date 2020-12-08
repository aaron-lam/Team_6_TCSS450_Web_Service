//initial setup
const express = require('express')
let pool = require('../../utilities/utils').pool

var router = express.Router()
const bodyParser = require("body-parser")
const { prependOnceListener } = require('../../utilities/sql_conn')

router.use(bodyParser.json())


/** CONFIRM a request
 * 
 * Takes a memberId in the body
 * 
 */
router.post('/:memberId?', (request, response, next) => {
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

      let query = 'UPDATE CONTACTS SET VERIFIED=1 WHERE MEMBERID_A=$1 AND MEMBERID_B=$2'
      let values = [confirmedMemberId,hostMemberId]

      pool.query(query,values)
      .then(result => {
         response.send({
            result: "success"
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

      let query = 'DELETE FROM CONTACTS WHERE MEMBERID_A=$1 AND MEMBERID_B=$2 AND VERIFIED=0'
      let values = [deniedMemberId,hostMemberId]

      pool.query(query,values)
      .then(result => {
         response.send({
            result: "success"
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
    let query = 'SELECT MemberID_A FROM CONTACTS WHERE MemberID_B=$1 and verified=0'
    let values = [request.decoded.memberid]

    pool.query(query,values)
    .then(result => {
        
        if (result.rows.length == 0) {
            response.status(400).send({
                message: "No contact requests",
            })
        } else {
            next()
        }
    })
}, (request, response) => {

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

    pool.query(query,values)
    .then(newResult => {
        response.send({
            contactRequests: newResult.rows
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
    })
})

module.exports = router;