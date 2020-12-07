//express is the framework we're going to use to handle requests
const express = require('express');

//Access the connection to Heroku Database
const pool = require('../../utilities/utils').pool;

const router = express.Router();

//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(require("body-parser").json());

const msg_functions = require('../../utilities/utils').messaging;

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} /chats Request to add a chat
 * @apiName PostChats
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} name the name for the chat
 * @apiParam {Object[]} memberIds lists of member ids
 *
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {Number} chatId the generated chatId
 *
 * @apiError (400: Unknown user) {String} message "unknown email address"
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiError (400: Unknow Chat ID) {String} message "invalid chat id"
 *
 * @apiUse JSONError
 */
router.post("/", (request, response, next) => {
  if (!request.body.name) {
    response.status(400).send({
      message: "Missing required information"
    })
  } else {
    next()
  }
}, (request, response) => {
  let insert = `INSERT INTO Chats(Name)
                  VALUES ($1)
                  RETURNING ChatId`;
  let values = [request.body.name];
  pool.query(insert, values)
    .then(result => {
      const chatRoomId = result.rows[0].chatid;
      addUserToChatRoom(chatRoomId, request.decoded.memberid);
      if (request.body.memberIds) {
        for (const id of request.body.memberIds) {
          addUserToChatRoom(chatRoomId, id);
          // send a notification of this message to ALL members with registered tokens
          let query = `SELECT token FROM Push_Token
                      WHERE memberid=$1`;
          let values = [id];
          pool.query(query, values)
            .then(result => {
              msg_functions.sendCreateRoomMessageToIndividual(
                result.rows[0].token,
                request.body.name);
            });
        }
      }
      response.send({
        sucess: true,
        chatID: chatRoomId
      });
    })
  .catch(err => {
    response.status(400).send({
      message: "SQL Error",
      error: err
    })
  });
});

/**
 * Add user to the chat room.
 * @param chatRoomId chat room ID
 * @param userId user ID
 */
function addUserToChatRoom(chatRoomId, userId) {
  const insert = `INSERT INTO ChatMembers(ChatId, MemberId)
                  VALUES ($1, $2)
                  RETURNING *`;
  const values = [chatRoomId, userId];
  pool.query(insert, values);
}

/**
 * @api {put} /chats/:chatId? Request add a user to a chat
 * @apiName PutChats
 * @apiGroup Chats
 *
 * @apiDescription Adds the user associated with the required JWT.
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} chatId the chat to add the user to
 *
 * @apiSuccess {boolean} success true when the name is inserted
 *
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number"
 * @apiError (400: Duplicate Email) {String} message "user already joined"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.put("/:chatId/", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.chatId || !request.body.memberIds) {
      response.status(400).send({
        message: "Missing required information"
      })
    } else if (isNaN(request.params.chatId)) {
      response.status(400).send({
        message: "Malformed parameter. chatId must be a number"
      })
    } {
      next()
    }
  }, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1';
    let values = [request.params.chatId];

    pool.query(query, values)
      .then(result => {
        if (result.rowCount === 0) {
          response.status(404).send({
            message: "Chat ID not found"
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
    //code here based on the results of the query
  }, (request, response, next) => {
    //validate email exists
    let query = 'SELECT * FROM Members WHERE MemberId=$1';
    let values = [request.decoded.memberid];

    pool.query(query, values)
      .then(result => {
        if (result.rowCount === 0) {
          response.status(404).send({
            message: "email not found"
          })
        } else {
          //user found
          next()
        }
      }).catch(error => {
      response.status(400).send({
        message: "SQL Error",
        error: error
      })
    })
}, (request, response, next) => {
    //validate email does not already exist in the chat
    for (const id of request.body.memberIds) {
      let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2';
      let values = [request.params.chatId, id];

      pool.query(query, values)
        .then(result => {
          if (result.rowCount > 0) {
            response.status(400).send({
              message: "Some of the selected contacts already joined the room. Please only select contacts that have not joined the chat yet."
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
    }
}, (request, response) => {
    const chatRoomId = request.params.chatId;
    for (const id of request.body.memberIds) {
      addUserToChatRoom(chatRoomId, id);
      // send a notification of this message to ALL members with registered tokens
      let query = `SELECT token FROM Push_Token
                      WHERE memberid=$1`;
      let values = [id];
      pool.query(query, values)
        .then(result => {
          msg_functions.sendCreateRoomMessageToIndividual(
            result.rows[0].token,
            request.body.name);
        });
    }
    response.send({
      sucess: true,
      chatID: chatRoomId
    });
  }
);

/**
 * @api {get} /chats/:chatId? Request to get the emails of user in a chat
 * @apiName GetChats
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} chatId the chat to look up.
 *
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} members List of members in the chat
 * @apiSuccess {String} messages.email The email for the member in the chat
 *
 * @apiError (404: ChatId Not Found) {String} message "Chat ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get("/:chatId", (request, response, next) => {
  //validate on missing or invalid (type) parameters
  if (!request.params.chatId) {
    response.status(400).send({
      message: "Missing required information"
    })
  } else if (isNaN(request.params.chatId)) {
    response.status(400).send({
      message: "Malformed parameter. chatId must be a number"
    })
  } else {
    next()
  }
}, (request, response, next) => {
  //validate chat id exists
  let query = 'SELECT * FROM CHATS WHERE ChatId=$1';
  let values = [request.params.chatId];

  pool.query(query, values)
    .then(result => {
      if (result.rowCount === 0) {
        response.status(404).send({
          message: "Chat ID not found"
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
  //REtrive the members
  let query = `SELECT Members.Email 
                    FROM ChatMembers
                    INNER JOIN Members ON ChatMembers.MemberId=Members.MemberId
                    WHERE ChatId=$1`
  let values = [request.params.chatId];
  pool.query(query, values)
    .then(result => {
      response.send({
        rowCount: result.rowCount,
        rows: result.rows
      })
    }).catch(err => {
    response.status(400).send({
      message: "SQL Error",
      error: err
    })
  })
});

/**
 * @api {get} /chats/email/:email? Request to get the chat room ids of user email in a chat
 * @apiName GetChats
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {String} user email to look up.
 *
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} members List of members in the chat
 * @apiSuccess {String} messages.email The email for the member in the chat
 *
 * @apiError (404: ChatId Not Found) {String} message "Chat ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get("/email/:email", (request, response, next) => {
  //validate on missing or invalid (type) parameters
  if (!request.params.email) {
    response.status(400).send({
      message: "Missing required information"
    })
  } else {
    next()
  }
}, (request, response) => {
  //validate chat id exists
  let query = 'SELECT MemberId FROM Members WHERE Email=$1';
  let values = [request.params.email];

  pool.query(query, values)
    .then(result => {
      if (result.rowCount === 0) {
        response.status(404).send({
          message: "Email does not found"
        })
      } else {
        //Retrieve the members
        let query = `SELECT chatid 
                    FROM ChatMembers
                    WHERE MemberId=$1`;
        let values = [result.rows[0].memberid];
        pool.query(query, values)
          .then(result => {
            response.send({
              rowCount: result.rowCount,
              rows: result.rows.map(row => row.chatid)
            })
          });
      }
    }).catch(error => {
    response.status(400).send({
      message: "SQL Error",
      error: error
    })
  })
});

/**
 * @api {delete} /chats/:chatId?/:email? Request delete a user from a chat
 * @apiName DeleteChats
 * @apiGroup Chats
 *
 * @apiDescription Does not delete the user associated with the required JWT but
 * instead delelets the user based on the email parameter.
 *
 * @apiParam {Number} chatId the chat to delete the user from
 * @apiParam {String} email the email of the user to delete
 *
 * @apiSuccess {boolean} success true when the name is deleted
 *
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number"
 * @apiError (400: Duplicate Email) {String} message "user not in chat"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.delete("/:chatId/:email", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.chatId || !request.params.email) {
      response.status(400).send({
        message: "Missing required information"
      })
    } else if (isNaN(request.params.chatId)) {
      response.status(400).send({
        message: "Malformed parameter. chatId must be a number"
      })
    } else {
      next()
    }
  }, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1';
    let values = [request.params.chatId];

    pool.query(query, values)
      .then(result => {
        if (result.rowCount === 0) {
          response.status(404).send({
            message: "Chat ID not found"
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
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM Members WHERE Email=$1';
    let values = [request.params.email];

    pool.query(query, values)
      .then(result => {
        if (result.rowCount === 0) {
          response.status(404).send({
            message: "email not found"
          })
        } else {
          request.params.email = result.rows[0].memberid;
          next()
        }
      }).catch(error => {
      response.status(400).send({
        message: "SQL Error",
        error: error
      })
    })
  }, (request, response, next) => {
    //validate email exists in the chat
    let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2';
    let values = [request.params.chatId, request.params.email];

    pool.query(query, values)
      .then(result => {
        if (result.rowCount > 0) {
          next()
        } else {
          response.status(400).send({
            message: "user not in chat"
          })
        }
      }).catch(error => {
      response.status(400).send({
        message: "SQL Error",
        error: error
      })
    })

  }, (request, response) => {
    //Delete the memberId from the chat
    let insert = `DELETE FROM ChatMembers
                  WHERE ChatId=$1
                  AND MemberId=$2
                  RETURNING *`;
    let values = [request.params.chatId, request.params.email];
    pool.query(insert, values)
      .then(result => {
        response.send({
          sucess: true
        })
      }).catch(err => {
      response.status(400).send({
        message: "SQL Error",
        error: err
      })
    })
  }
);

module.exports = router;
