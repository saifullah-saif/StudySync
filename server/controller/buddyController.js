const BuddyService = require("../services/buddyServices");

const buddyService = BuddyService.getInstance();

class BuddyController {
  // Get buddies (peers or mentors)
  static async getBuddies(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware
      const { type, search } = req.query; // 'peers' or 'mentors', and search query

      // Validate user ID
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate type parameter
      const buddyType = type === 'mentors' ? 'mentors' : 'peers'; // Default to peers
      
      // Get search query (can be empty)
      const searchQuery = search ? search.toString().trim() : '';

      const buddies = await buddyService.getBuddies(userId, buddyType, searchQuery);

      res.status(200).json({
        success: true,
        message: `${buddyType.charAt(0).toUpperCase() + buddyType.slice(1)} retrieved successfully`,
        data: { 
          buddies,
          type: buddyType,
          count: buddies.length,
          searchQuery: searchQuery || null
        },
      });
    } catch (error) {
      console.error("Get buddies error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve buddies",
        error: error.message,
      });
    }
  }
}

module.exports = BuddyController;