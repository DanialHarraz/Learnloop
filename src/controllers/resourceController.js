const resourceModel = require('../models/resourceModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Upload resource
exports.uploadResource = [
  upload.single('file'),
  async (req, res) => {
    try {
      const { userId, name, fileType } = req.body;
      const file = req.file;

      if (!file || !userId || !name || !fileType) {
        return res.status(400).json({ message: 'Missing required fields.' });
      }

      const resource = await resourceModel.createResource({
        name,
        fileType,
        url: `/uploads/${file.filename}`,
        uploadedBy: parseInt(userId),
      });

      res.status(201).json({ message: 'File uploaded successfully.', resource });
    } catch (error) {
      console.error('Error uploading resource:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },
];

exports.getResources = async (req, res) => {
  try {
    const { search, fileType, sortBy } = req.query; // Accept search and fileType
    let orderBy = {};

    // Determine sorting order based on the sortBy value
    switch (sortBy) {
      case 'most-downloads':
        orderBy = { downloads: 'desc' }; // Sort by most downloads
        break;
      case 'least-downloads':
        orderBy = { downloads: 'asc' }; // Sort by least downloads
        break;
      case 'a-z':
        orderBy = { name: 'asc' }; // Sort alphabetically
        break;
      case 'most-views':
        orderBy = { views: 'desc' }; // Sort by most views
        break;
      default:
        orderBy = { uploadedAt: 'desc' }; // Default sorting (newest first)
        break;
    }

    const resources = await resourceModel.searchAndFilterResources(search, fileType, orderBy);
    res.status(200).json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};








// Increment views for videos
exports.incrementViews = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const resource = await resourceModel.incrementViews(parseInt(resourceId));
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }
    res.status(200).json({ message: 'View count incremented.', resource });
  } catch (error) {
    console.error('Error incrementing views:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.incrementDownloads = async (req, res) => {
  try {
    const { filename } = req.params;

    // Construct the file path
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found.' });
    }

    // Increment the download count in the database
    const resource = await resourceModel.incrementDownloadsByFilename(filename);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found in the database.' });
    }

    // Send the file to the client for download
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error while sending the file for download:', err);
        res.status(500).json({ message: 'Failed to download the file.' });
      }
    });
  } catch (error) {
    console.error('Error incrementing downloads:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};





// Delete resource
exports.deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    await resourceModel.deleteResource(parseInt(resourceId));
    res.status(200).json({ message: 'Resource deleted successfully.' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update resource details
exports.updateResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ message: 'New name is required.' });
    }

    const updatedResource = await resourceModel.updateResource(parseInt(resourceId), newName);
    res.status(200).json({ message: 'Resource updated successfully.', resource: updatedResource });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Pin a resource
exports.pinResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const updatedResource = await resourceModel.pinResource(parseInt(resourceId));
    res.status(200).json({ message: 'Resource pinned successfully.', resource: updatedResource });
  } catch (error) {
    console.error('Error pinning resource:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Unpin a resource
exports.unpinResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const updatedResource = await resourceModel.unpinResource(parseInt(resourceId));
    res.status(200).json({ message: 'Resource unpinned successfully.', resource: updatedResource });
  } catch (error) {
    console.error('Error unpinning resource:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


exports.bulkDownloadResources = async (req, res) => {
  try {
    const { resourceIds } = req.body;

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ message: 'No resources selected for download.' });
    }

    // Fetch resource details from the database
    const resources = await resourceModel.getResourcesByIds(resourceIds);

    if (resources.length === 0) {
      return res.status(404).json({ message: 'No resources found for the provided IDs.' });
    }

    // Create a ZIP file
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment('resources.zip');

    archive.on('error', (err) => {
      console.error('Error creating ZIP archive:', err);
      res.status(500).json({ message: 'Failed to create ZIP file.' });
    });

    // Stream the ZIP to the client
    archive.pipe(res);

    // Add files to the ZIP archive
    resources.forEach((resource) => {
      const filePath = path.join(__dirname, '../../uploads', resource.url.split('/').pop());
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: resource.name });
      }
    });

    await archive.finalize();
  } catch (error) {
    console.error('Error in bulk download:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getTrendingResources = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5; // Get limit from query params, default to 5
    const trendingResources = await resourceModel.getTrendingResources(limit);
    res.status(200).json(trendingResources);
  } catch (error) {
    console.error('Error fetching trending resources:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
