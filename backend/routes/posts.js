const express = require('express');
const checkAuth = require('../middleware/check-auth');
const PostController = require('../controllers/post');
const extractFile = require('../middleware/file');

const router = express.Router();

router.post(
  '',
  checkAuth,
  extractFile,
  PostController.createPost
);

router.get('', PostController.getPosts);

router.put(
  '/:id',
  checkAuth,
  extractFile,
  PostController.updatePost);

router.get('/:id', PostController.getPost);

router.delete('/:id', checkAuth, PostController.deletePost);


module.exports = router;
