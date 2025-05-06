const prisma = require('./prismaClient');

// Create a new resource
exports.createResource = async ({ name, fileType, url, uploadedBy }) => {
  return await prisma.resource.create({
    data: {
      name,
      fileType,
      url,
      uploadedBy,
      uploadedAt: new Date(),
      views: fileType === 'mp4' ? 0 : undefined, // Initialize views for videos
      downloads: fileType !== 'mp4' ? 0 : undefined, // Initialize downloads for documents
    },
  });
};

exports.getAllResources = async (orderBy = { uploadedAt: 'desc' }) => {
  return await prisma.resource.findMany({
    orderBy, // Use the dynamic orderBy parameter
    include: {
      User: { select: { name: true } }, // Include uploader's name
    },
  });
};




// Increment views for a resource
exports.incrementViews = async (resourceId) => {
  return await prisma.resource.update({
    where: { id: resourceId },
    data: { views: { increment: 1 } }, // Increment views
  });
};

exports.incrementDownloadsByFilename = async (filename) => {
  const resource = await prisma.resource.findFirst({
    where: { url: `/uploads/${filename}` }, // Match the `url` column with the provided filename
  });

  if (!resource) return null;

  // Increment downloads count
  return await prisma.resource.update({
    where: { id: resource.id },
    data: { downloads: { increment: 1 } },
  });
};



// Delete a resource
exports.deleteResource = async (resourceId) => {
  return await prisma.resource.delete({
    where: { id: resourceId },
  });
};

// Update resource details
exports.updateResource = async (resourceId, newName) => {
  return await prisma.resource.update({
    where: { id: resourceId },
    data: { name: newName },
  });
};


exports.searchAndFilterResources = async (search = '', fileType = '', orderBy = { uploadedAt: 'desc' }) => {
  const whereClause = {
    name: { contains: search, mode: 'insensitive' }, // Search by name
  };

  if (fileType) {
    whereClause.fileType = fileType; // Add fileType filter if provided
  }

  return await prisma.resource.findMany({
    where: whereClause,
    orderBy, // Apply sorting
    include: {
      User: { select: { name: true } }, // Include uploader details
    },
  });
};

// Pin a resource
exports.pinResource = async (resourceId) => {
  return await prisma.resource.update({
    where: { id: resourceId },
    data: { pinned: true },
  });
};

// Unpin a resource
exports.unpinResource = async (resourceId) => {
  return await prisma.resource.update({
    where: { id: resourceId },
    data: { pinned: false },
  });
};

// Get all resources (pinned resources first)
exports.getAllResources = async (orderBy = { uploadedAt: 'desc' }) => {
  return await prisma.resource.findMany({
    orderBy: [
      { pinned: 'desc' }, // Pinned resources first
      orderBy,
    ],
    include: {
      User: { select: { name: true } },
    },
  });
};

// src/models/resourceModel.js
exports.getResourcesByIds = async (ids) => {
  // Ensure the IDs are integers
  const parsedIds = ids.map((id) => parseInt(id, 10));

  return await prisma.resource.findMany({
    where: {
      id: { in: parsedIds }, // Pass integer IDs
    },
    select: {
      id: true,
      name: true,
      url: true,
    },
  });
};

exports.getTrendingResources = async (limit = 5) => {
  return await prisma.resource.findMany({
    where: {
      OR: [
        { downloads: { gt: 0 } }, // Include resources that have at least 1 download
        { views: { gt: 0 } }, // OR at least 1 view for videos
      ],
    },
    orderBy: [
      { downloads: 'desc' }, // Sort by most downloads first
      { views: 'desc' }, // Then by most views
    ],
    take: limit, // Limit results
    select: {
      id: true,
      name: true,
      fileType: true,
      downloads: true,
      views: true,
      url: true,
    },
  });
};

