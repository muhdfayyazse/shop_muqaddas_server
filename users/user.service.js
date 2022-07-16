const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const crypto = require('crypto');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    validateLogin
};

async function getAll() {
    return await db.User.findAll();
}

async function getById(id) {
    return await getUser(id);
}

async function create(params) {
    // validate
    if (await db.User.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already registered';
    }

    const user = new db.User(params);
    
    // hash password
    user.passwordHash = await bcrypt.hash(params.password, 10);

    // save user
    await user.save();
    const userSaved = await db.User.findOne({ where: { email: params.email } });
    if (!userSaved) throw 'User not found';

    return {
        "idToken": crypto.randomUUID(),
        "localId": ""+userSaved.id,
        "expiresIn": "30000"
    };
}

async function update(id, params) {
    const user = await getUser(id);

    // validate
    const emailChanged = params.email && user.email !== params.email;
    if (emailChanged && await db.User.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already registered';
    }

    // hash password if it was entered
    if (params.password) {
        params.passwordHash = await bcrypt.hash(params.password, 10);
    }

    // copy params to user and save
    Object.assign(user, params);
    await user.save();
}

async function _delete(id) {
    const user = await getUser(id);
    await user.destroy();
}

// helper functions

async function getUser(id) {
    const user = await db.User.findByPk(id);
    if (!user) throw 'User not found';
    return user;
}

async function validateLogin(email, password) {
    // validate
    const user = await db.User.findOne({ where: { email: email } });
    if (!user) throw 'User not found';

    const isMatched = await bcrypt.compare(password, user.passwordHash);
    if(!isMatched) throw 'Invlid User/Password';


    return {
        "idToken": crypto.randomUUID(),
        "localId": ""+user.id,
        "expiresIn": "30000"
    };
}



