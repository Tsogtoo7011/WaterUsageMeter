const express = require('express');
const router = express.Router();
const AdminUserController = require('../controllers/AdminUserController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware for all routes
router.use(authMiddleware.authenticate);

// User listing and CRUD routes
router.get('/', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.getAllUsers);
router.get('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.getUserById);
router.post('/', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.createUser);
router.put('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.updateUser);
router.delete('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.deleteUser);

// Admin rights update route
router.put('/:id/admin-rights',
  authMiddleware.verifiedOnly,
  authMiddleware.adminOnly,
  express.json(),
  AdminUserController.updateAdminRight
);

// Password handling route
router.put('/:id/change-password', authMiddleware.verifiedOnly, AdminUserController.changePassword);

module.exports = router;