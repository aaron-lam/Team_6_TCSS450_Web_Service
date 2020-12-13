
/**
 * Returns a message when email is not the proper format
 * @param {String} email the email to check
 */
function validateEmail(email) {

    splitEmail = email.split('@')
    if(splitEmail.length > 2) {
        return 'Email can only contain one @'
    }
    local = splitEmail[0]
    domain = splitEmail[1]

    let regexEmoji = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g
    if(regexEmoji.test(local) || regexEmoji.test(domain)) {
        return 'Email cannot contain emojis'
    }

    illegalChars = ['"', ",", " "]
    
    illegalChars.forEach(char => {
        if(local.includes(char)) return `${char} cannot be present before @`
    })

    if(!domain.includes('.')) return 'Domain must contain a period'

}

function validateName(name, type) {
    //only letters with no spaces
    let nameRegex = /^[a-zA-Z]*$/g
    if(!nameRegex.test(name)) return `${type} must contain letters with no spaces`
}


function validatePassword(password) {
    if(password.length < 1) {
        return 'Password cannot be empty'
    } else if (password.length < 6) {
        return 'Password must be at least 6 characters long'
    } else {
        if(!(/[.*@!#%&()^~{}]+/.test(password))) return 'Password must contain a special character'
        if(!(/[A-Z]+/.test(password))) return 'Password must contain an uppercase character' 
        if(!(/[a-z]+/.test(password))) return 'Password must contain a lowercase character'
        if(!(/[0-9]/.test(password))) return 'Password must contain a number'
    }
}



module.exports = {
    validateEmail, validateName, validatePassword
}
