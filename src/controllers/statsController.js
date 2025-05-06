const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.getStatistics = async (req, res) => {
    try {
       
        const happyUsers = await prisma.user.count();
       

        res.json({
            happyUsers
           
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

