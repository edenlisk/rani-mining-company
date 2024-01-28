const {Router} = require('express');
const {generate} = require('../utils/docTemplater');
const router = Router();


router.route('/')
    .post(generate);

module.exports = router;