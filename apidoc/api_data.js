define({ "api": [
  {
    "type": "get",
    "url": "/auth",
    "title": "Request to sign a user in the system",
    "name": "GetAuth",
    "group": "Auth",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>&quot;username:password&quot; uses Basic Auth</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "boolean",
            "optional": false,
            "field": "success",
            "description": "<p>true when the name is found and password matches</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Authentication successful!</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>JSON Web Token</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "400: Missing Parameters": [
          {
            "group": "400: Missing Parameters",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Missing required information&quot;</p>"
          }
        ],
        "404: User Not Found": [
          {
            "group": "404: User Not Found",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;User not found&quot;</p>"
          }
        ],
        "400: Invalid Credentials": [
          {
            "group": "400: Invalid Credentials",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Credentials did not match&quot;</p>"
          }
        ],
        "400: SQL Error": [
          {
            "group": "400: SQL Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>the reported SQL error details</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/auth/login.js",
    "groupTitle": "Auth"
  },
  {
    "type": "post",
    "url": "/auth",
    "title": "Request to register a user",
    "name": "PostAuth",
    "group": "Auth",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "first",
            "description": "<p>a users first name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "last",
            "description": "<p>a users last name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>a username</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>a users email *required unique</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>a users password</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 201": [
          {
            "group": "Success 201",
            "type": "boolean",
            "optional": false,
            "field": "success",
            "description": "<p>true when the name is inserted</p>"
          },
          {
            "group": "Success 201",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>the email of the user inserted</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "400: Missing Parameters": [
          {
            "group": "400: Missing Parameters",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Missing required information&quot;</p>"
          }
        ],
        "400: Username exists": [
          {
            "group": "400: Username exists",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Username exists&quot;</p>"
          }
        ],
        "400: Email exists": [
          {
            "group": "400: Email exists",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Email exists&quot;</p>"
          }
        ],
        "400: SQL Error": [
          {
            "group": "400: SQL Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>the reported SQL error details</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/auth/register.js",
    "groupTitle": "Auth"
  },
  {
    "type": "delete",
    "url": "/contacts/:userId?",
    "title": "Request to delete a contact",
    "name": "DeleteContacts",
    "group": "Contacts",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>Valid JSON Web Token JWT</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "userId",
            "description": "<p>the contact's user ID number</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "boolean",
            "optional": false,
            "field": "success",
            "description": "<p>true when the contact is deleted</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "400: Invalid contact": [
          {
            "group": "400: Invalid contact",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;User not found&quot;</p>"
          }
        ],
        "400: Unconfirmed contact": [
          {
            "group": "400: Unconfirmed contact",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;User is not a contact&quot;</p>"
          }
        ],
        "400: Missing Parameters": [
          {
            "group": "400: Missing Parameters",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Missing required information&quot;</p>"
          }
        ],
        "400: userId Error": [
          {
            "group": "400: userId Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Malformed parameter. userId must be a number&quot;</p>"
          }
        ],
        "400: SQL Error": [
          {
            "group": "400: SQL Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>the reported SQL error details</p>"
          }
        ],
        "400: JSON Error": [
          {
            "group": "400: JSON Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;malformed JSON in parameters&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/contacts.js",
    "groupTitle": "Contacts"
  },
  {
    "type": "get",
    "url": "/contacts/:userId?",
    "title": "Request to view a contact",
    "name": "GetContacts",
    "group": "Contacts",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>Valid JSON Web Token JWT</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "userId",
            "description": "<p>(Optional) the contact's user ID number.  If no number provided, all are contacts returned</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "contacts",
            "description": "<p>List of confirmed contacts associated with the requester</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "first",
            "description": "<p>requested contact's first name</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "last",
            "description": "<p>requested contact's last name</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>requested contact's username</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "400: Invalid user": [
          {
            "group": "400: Invalid user",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;User not found&quot;</p>"
          }
        ],
        "400: Not a contact": [
          {
            "group": "400: Not a contact",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;User is not a contact&quot;</p>"
          }
        ],
        "400: Unconfirmed contact": [
          {
            "group": "400: Unconfirmed contact",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Contact is not confirmed&quot;</p>"
          }
        ],
        "400: Empty contact list": [
          {
            "group": "400: Empty contact list",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;No contacts exist&quot;</p>"
          }
        ],
        "400: userId Error": [
          {
            "group": "400: userId Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Malformed parameter. userId must be a number&quot;</p>"
          }
        ],
        "400: SQL Error": [
          {
            "group": "400: SQL Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>the reported SQL error details</p>"
          }
        ],
        "400: JSON Error": [
          {
            "group": "400: JSON Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;malformed JSON in parameters&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/contacts.js",
    "groupTitle": "Contacts"
  },
  {
    "type": "post",
    "url": "/contacts",
    "title": "Request to add a contact to the user's contact list",
    "name": "PostContacts",
    "group": "Contacts",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "authorization",
            "description": "<p>Valid JSON Web Token JWT</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "userId",
            "description": "<p>the userId of the contact to be added</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "boolean",
            "optional": false,
            "field": "success",
            "description": "<p>true when the contact is added</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "400: Duplicate contact": [
          {
            "group": "400: Duplicate contact",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Contact already exists&quot;</p>"
          }
        ],
        "400: Missing Parameters": [
          {
            "group": "400: Missing Parameters",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Missing required information&quot;</p>"
          }
        ],
        "400: SQL Error": [
          {
            "group": "400: SQL Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>the reported SQL error details</p>"
          }
        ],
        "400: userId Error": [
          {
            "group": "400: userId Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Malformed parameter. userId must be a number&quot;</p>"
          }
        ],
        "400: Contact userId does not exist": [
          {
            "group": "400: Contact userId does not exist",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Added User's ID not found&quot;</p>"
          }
        ],
        "400: JSON Error": [
          {
            "group": "400: JSON Error",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;malformed JSON in parameters&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/contacts.js",
    "groupTitle": "Contacts"
  },
  {
    "type": "post",
    "url": "/password",
    "title": "Request to change a password",
    "name": "PostAuth",
    "group": "Password",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>a users email</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>a users current password</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 201": [
          {
            "group": "Success 201",
            "type": "boolean",
            "optional": false,
            "field": "success",
            "description": "<p>true when password is changed</p>"
          },
          {
            "group": "Success 201",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "400: Missing Parameters": [
          {
            "group": "400: Missing Parameters",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Missing required information&quot;</p>"
          }
        ],
        "400: Credentials not match": [
          {
            "group": "400: Credentials not match",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Credentials not match&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/auth/password/change_password.js",
    "groupTitle": "Password"
  },
  {
    "type": "get",
    "url": "/password/reset",
    "title": "Request to reset a password",
    "name": "getPasswordReset",
    "group": "Password",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>a users email</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>a users current password</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 201": [
          {
            "group": "Success 201",
            "type": "boolean",
            "optional": false,
            "field": "success",
            "description": "<p>true when the reset password url is sent</p>"
          },
          {
            "group": "Success 201",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>the email of the account that need to reset password</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "400: Missing Parameters": [
          {
            "group": "400: Missing Parameters",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Missing required information&quot;</p>"
          }
        ],
        "400: Email not exists": [
          {
            "group": "400: Email not exists",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Email not exists&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/auth/password/reset_password.js",
    "groupTitle": "Password"
  },
  {
    "type": "get",
    "url": "/password/reset/:verification",
    "title": "Request to render \"reset password\" web page",
    "name": "getPasswordResetVerification",
    "group": "Password",
    "success": {
      "fields": {
        "Success 202": [
          {
            "group": "Success 202",
            "type": "boolean",
            "optional": false,
            "field": "success",
            "description": "<p>true when the verification code is valid</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "404: Verification code not found": [
          {
            "group": "404: Verification code not found",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;The reset password URL is invalid&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/auth/password/reset_password.js",
    "groupTitle": "Password"
  },
  {
    "type": "get",
    "url": "/verification/{verification_code}",
    "title": "Request to verify user",
    "name": "GetVerification",
    "group": "Verification",
    "success": {
      "fields": {
        "Success 202": [
          {
            "group": "Success 202",
            "type": "boolean",
            "optional": false,
            "field": "success",
            "description": "<p>true when the user was validated</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "400: Verification code not found": [
          {
            "group": "400: Verification code not found",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Code not found&quot;</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/auth/verify.js",
    "groupTitle": "Verification"
  }
] });
