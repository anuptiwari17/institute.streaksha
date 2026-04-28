const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const tenantScope = require('../../middlewares/tenantScope');
const roleGuard = require('../../middlewares/roleGuard');

router.use(auth, tenantScope);

router.get('/', roleGuard('super_admin'), controller.listTenants);
router.get('/:id', roleGuard('super_admin'), controller.getTenant);
router.patch('/:id/deactivate', roleGuard('super_admin'), controller.deactivateTenant);
router.patch('/:id/activate', roleGuard('super_admin'), controller.activateTenant);
router.get('/:id/stats', roleGuard('super_admin'), controller.getTenantStats);

module.exports = router;