
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
    illegalChars = ['+', '"', ",", " "]
    
    illegalChars.forEach(char => {
        if(local.includes(char)) return `${char} cannot be present before @`
    })

    if(!domain.includes('.')) return 'Domain must contain a period'

}


module.exports = validateEmail;
