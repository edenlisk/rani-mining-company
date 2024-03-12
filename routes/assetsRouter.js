const { Router } = require("express");
const { createAsset,
    deleteAsset,
    getAllAssets,
    getOneAsset,
    updateAsset } = require('../controllers/assetsControllers');
const router = Router();

router.route("/")
    .get(getAllAssets)
    .post(createAsset)


router.route("/:assetId")
    .get(getOneAsset)
    .patch(updateAsset)
    .delete(deleteAsset)

module.exports = router;