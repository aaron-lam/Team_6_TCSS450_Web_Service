//initial setup
const express = require('express')
let pool = require('../../utilities/utils').pool

var router = express.Router()
const bodyParser = require("body-parser")

router.use(bodyParser.json())

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 

 /**
 * @api {get} /contacts/search_contacts/:username? Request to search for a contact
 * @apiName SearchContacts
 * @apiGroup Contacts
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} username (Optional) a username to search for among the user list
 * 
 * @apiSuccess {Object[]} results Contact information for the requested username
 * 
 * @apiError (400: Missing parameters) {String} message "Missing parameters"
 * 
 * @apiError (404: No matches) {String} message "No matches found"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.get("/:username?", (request, response, next) => {
    // Empty parameter operation
    if (!request.params.username) {
        response.status(400).send({
            message: "Missing parameters"
        })
    } else {
        next()
    }
}, (request, response) => {
    let query = `SELECT MemberID, FirstName, LastName, Username FROM MEMBERS
                 WHERE lower(Username)=$1`
    let values = [request.params.username.toLowerCase()]
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "No matches found",
                })
            } else {
                response.send({
                    results: result.rows
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
})


// /**
//  * @apiDefine JSONError
//  * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
//  */ 

//  /**
//  * @api {get} /contacts/search_contacts/:first?/:last?/:username? Request to search for a contact
//  * @apiName SearchContacts
//  * @apiGroup Contacts
//  * 
//  * @apiHeader {String} authorization Valid JSON Web Token JWT
//  * @apiParam {String} first (Optional) a first name to search for among the user list
//  * @apiParam {String} last (Optional) a last name to search for among the user list
//  * @apiParam {String} username (Optional) a username to search for among the user list
//  * @apiParam {String} email (Optional) an email address to search for among the user list
//  * 
//  * @apiSuccess {Object[]} results List of results that matched one or more parameters of the search request
//  * 
//  * @apiError (400: No parameters entered) {String} message "Must include at least one parameter"
//  * 
//  * @apiError (404: No matches) {String} message "No matches found"
//  * 
//  * @apiError (400: SQL Error) {String} message the reported SQL error details
//  * 
//  * @apiUse JSONError
//  */ 
// router.get("/:first?/:last?/:username?/:email?", (request, response, next) => {
//     // Empty parameter operation
//     if (!request.params.first && !request.params.last && !request.params.username && !request.params.email) {
//         response.status(400).send({
//             message: "Must include at least one parameter"
//         })
//     } else {
//         next()
//     }
// }, (request, response, next) => {
//     // Search Member Table for matches
//     let index = 1
//     let query = 'SELECT MemberID, FirstName, LastName, Username, Email FROM MEMBERS WHERE '
//     let values = []

//     if (request.params.first) {
//         query += "lower(FirstName)=$" + index
//         values[index - 1] = request.params.first.toLowerCase()
//         index++
//     }
//     if (request.params.last) {
//         if (index > 1) query += " OR "
//         query += "lower(LastName)=$" + index
//         values[index - 1] = request.params.last.toLowerCase()
//         index++
//     }
//     if (request.params.username) {
//         if (index > 1) query += " OR "
//         query += "lower(Username)=$" + index
//         values[index - 1] = request.params.username.toLowerCase()
//         index++
//     }
//     if (request.params.email) {
//         if (index > 1) query += " OR "
//         query += "lower(Email) =$" + index
//         request.params.email = request.params.email.toLowerCase()
//         values[index - 1] = request.params.email
//     }

//     console.log(query);
//     console.log(values);

//     pool.query(query, values)
//         .then(result => {
//             if (result.rowCount == 0) {
//                 response.status(404).send({
//                     message: "No matches found",
//                 })
//             } else {
//                 request.results = result.rows
//                 next()
//             }
//         }).catch(error => {
//             response.status(400).send({
//                 message: "SQL Error",
//                 error: error
//             })
//         })
// }, (request, response) => {
//     // Sort list of matches
//     const sorted_results = {};
//     let index = 1;

//     // Add matched usernames/emails first
//     for (let i = 0; i < request.results.length; i++) {
//         if (request.results[i].username == request.params.username ||
//             request.results[i].email == request.params.email) {
//                 sorted_results[index] = {"first": request.results[i].firstname,
//                                          "last": request.results[i].lastname,
//                                          "username": request.results[i].username,
//                                          "id": request.results[i].memberid}
//                 index++
//                 request.results[i].used = true;
//         }
//     }

//     // Add matches of first and last name
//     for (let i = 0; i < request.results.length; i++) {
//         if (!request.results[i].used && 
//             request.results[i].firstname == request.params.first &&
//             request.results[i].lastname == request.params.last) {
//                 sorted_results[index] = {"first": request.results[i].firstname,
//                                          "last": request.results[i].lastname,
//                                          "username": request.results[i].username,
//                                          "id": request.results[i].memberid}
//                 index++
//                 request.results[i].used = true;
//         }
//     }

//     // Add remaining matches
//     for (let i = 0; i < request.results.length; i++) {
//         if (!request.results[i].used) {
//             request.results[i].used = true;
//             sorted_results[index] = {"first": request.results[i].firstname,
//                                      "last": request.results[i].lastname,
//                                      "username": request.results[i].username,
//                                      "id": request.results[i].memberid}
//             index++
//         }
//     }

//     response.send({
//         results: sorted_results
//     })
// })

module.exports = router
