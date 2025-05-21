const express = require('express');
const router = express.Router();
const AdminUserController = require('../controllers/AdminUserController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);

router.get('/', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.getAllUsers);
router.get('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.getUserById);
router.post('/', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.createUser);
router.put('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.updateUser);
router.delete('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.deleteUser);

router.put('/:id/admin-rights',
  authMiddleware.verifiedOnly,
  authMiddleware.adminOnly,
  express.json(),
  AdminUserController.updateAdminRight
);

router.put('/:id/change-password', authMiddleware.verifiedOnly, AdminUserController.changePassword);

module.exports = router;