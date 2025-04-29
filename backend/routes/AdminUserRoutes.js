const express = require('express');
const router = express.Router();
const AdminUserController = require('../controllers/AdminUserController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.authenticate);

router.get('/', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.getAllUsers); 
router.get('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.getUserById); 
router.put('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.updateUser); 
router.put('/:id/admin-rights', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.updateAdminRight); 
router.delete('/:id', authMiddleware.verifiedOnly, authMiddleware.adminOnly, AdminUserController.deleteUser); 

module.exports = router;