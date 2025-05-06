const express = require('express');
const resourceController = require('../controllers/resourceController');
const path = require('path');

const router = express.Router();

// Resource routes
router.post('/upload', resourceController.uploadResource);
router.get('/', resourceController.getResources);
router.put('/views/:resourceId', resourceController.incrementViews);
router.get('/downloads/:filename', resourceController.incrementDownloads);
router.delete('/:resourceId', resourceController.deleteResource);
router.put('/:resourceId', resourceController.updateResource);
router.put('/pin/:resourceId', resourceController.pinResource);   // Pin a resource
router.put('/unpin/:resourceId', resourceController.unpinResource); // Unpin a resource

router.post('/bulk-download', resourceController.bulkDownloadResources);
router.get('/trending', resourceController.getTrendingResources);


// File download route
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(404).json({ message: 'File not found' });
    }
  });
});

module.exports = router;
