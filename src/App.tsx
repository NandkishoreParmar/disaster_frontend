import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  AlertTriangle,
  MapPin,
  MessageSquare,
  Shield,
  Clock,
  Plus,
  Search,
  Filter,
  Bell,
  Globe,
  Users,
  Activity,
} from "lucide-react";

// Types
interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
  reports?: { count: number }[];
}

interface SocialMediaPost {
  id: string;
  platform: string;
  user: string;
  content: string;
  timestamp: string;
  location: string;
  urgency: "low" | "medium" | "high" | "critical";
  verified: boolean;
}

interface Resource {
  id: string;
  name: string;
  location_name: string;
  type: string;
  description?: string;
}

interface OfficialUpdate {
  id: string;
  source: string;
  title: string;
  content: string;
  published_at: string;
  priority: "low" | "medium" | "high";
}

function App() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<string | null>(null);
  const [socialMedia, setSocialMedia] = useState<SocialMediaPost[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [officialUpdates, setOfficialUpdates] = useState<OfficialUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<
    "disasters" | "social" | "resources" | "updates"
  >("disasters");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDisaster, setNewDisaster] = useState({
    title: "",
    location_name: "",
    description: "",
    tags: "",
  });

  // Initialize socket connection
  useEffect(() => {
    const socketConnection = io("https://disaster-backend-6h90.onrender.com");
    setSocket(socketConnection);

    socketConnection.on("connect", () => {
      console.log("Connected to server");
    });

    socketConnection.on("disaster_created", (disaster: Disaster) => {
      setDisasters((prev) => [disaster, ...prev]);
    });

    socketConnection.on("disaster_updated", (disaster: Disaster) => {
      setDisasters((prev) =>
        prev.map((d) => (d.id === disaster.id ? disaster : d))
      );
    });

    socketConnection.on("social_media_updated", (data: any) => {
      setSocialMedia(data.posts);
    });

    socketConnection.on("resources_updated", (data: any) => {
      setResources(data.resources);
    });

    socketConnection.on("official_updates_updated", (data: any) => {
      setOfficialUpdates(data.updates);
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadDisasters();
  }, []);

  const loadDisasters = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://disaster-backend-6h90.onrender.com/api/disasters", {
        headers: {
          "X-User-ID": "netrunnerX",
        },
      });
      const data = await response.json();
      setDisasters(data);
    } catch (error) {
      console.error("Error loading disasters:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDisasterData = async (disasterId: string) => {
    if (socket) {
      socket.emit("join_disaster", disasterId);
    }

    try {
      // Load social media data
      const socialResponse = await fetch(
        `https://disaster-backend-6h90.onrender.com/api/social-media/${disasterId}/social-media`,
        {
          headers: { "X-User-ID": "netrunnerX" },
        }
      );
      const socialData = await socialResponse.json();
      setSocialMedia(socialData.posts);

      // Load resources
      const resourcesResponse = await fetch(
        `https://disaster-backend-6h90.onrender.com/api/resources/${disasterId}/resources`,
        {
          headers: { "X-User-ID": "netrunnerX" },
        }
      );
      const resourcesData = await resourcesResponse.json();
      console.log("data:", resourcesData);
      setResources(resourcesData.resources);

      // Load official updates
      const updatesResponse = await fetch(
        `https://disaster-backend-6h90.onrender.com/api/updates/${disasterId}/official-updates`,
        {
          headers: { "X-User-ID": "netrunnerX" },
        }
      );
      const updatesData = await updatesResponse.json();
      setOfficialUpdates(updatesData.updates);
    } catch (error) {
      console.error("Error loading disaster data:", error);
    }
  };

  const createDisaster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("https://disaster-backend-6h90.onrender.com/api/disasters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "netrunnerX",
        },
        body: JSON.stringify({
          ...newDisaster,
          tags: newDisaster.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        setNewDisaster({
          title: "",
          location_name: "",
          description: "",
          tags: "",
        });
        setShowCreateForm(false);
        loadDisasters();
      }
    } catch (error) {
      console.error("Error creating disaster:", error);
    }
  };

  const selectDisaster = (disasterId: string) => {
    setSelectedDisaster(disasterId);
    setActiveTab("social");
    loadDisasterData(disasterId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">
                Disaster Response Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity className="h-4 w-4 text-green-500" />
                <span>Live Updates</span>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Report Disaster
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Disasters List */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-red-600" />
                  Active Disasters
                </h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {disasters.map((disaster) => (
                      <div
                        key={disaster.id}
                        onClick={() => selectDisaster(disaster.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedDisaster === disaster.id
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {disaster.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {disaster.location_name}
                            </p>
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {disaster.description}
                            </p>
                            <div className="flex items-center mt-3 space-x-2">
                              {disaster.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(
                                disaster.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Disaster Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedDisaster ? (
              <>
                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-md">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                      {[
                        { id: "resources", label: "Resources", icon: Users },
                        {
                          id: "social",
                          label: "Social Media",
                          icon: MessageSquare,
                        },
                        {
                          id: "updates",
                          label: "Official Updates",
                          icon: Globe,
                        },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                              ? "border-red-500 text-red-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <tab.icon className="h-4 w-4 inline mr-2" />
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === "social" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Social Media Reports
                        </h3>
                        {socialMedia.map((post) => (
                          <div
                            key={post.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="font-medium text-gray-900">
                                    @{post.user}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {post.platform}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(
                                      post.urgency
                                    )}`}
                                  >
                                    {post.urgency}
                                  </span>
                                  {post.verified && (
                                    <Shield className="h-4 w-4 text-green-500" />
                                  )}
                                </div>
                                <p className="text-gray-800 mb-2">
                                  {post.content}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {post.location}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {new Date(post.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === "resources" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Official Resources
                        </h3>
                        {officialUpdates.map((update) => (
                          <div
                            key={update.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900">
                                {update.title}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                  update.priority
                                )}`}
                              >
                                {update.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {update.source}
                            </p>
                            <p className="text-gray-800 mb-3">
                              {update.content}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(update.published_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === "updates" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Official Updates
                        </h3>
                        {officialUpdates.map((update) => (
                          <div
                            key={update.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900">
                                {update.title}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                  update.priority
                                )}`}
                              >
                                {update.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {update.source}
                            </p>
                            <p className="text-gray-800 mb-3">
                              {update.content}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(update.published_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Disaster
                </h3>
                <p className="text-gray-600">
                  Choose a disaster from the list to view detailed information
                  and real-time updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Disaster Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Report New Disaster
              </h3>
            </div>
            <form onSubmit={createDisaster} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newDisaster.title}
                  onChange={(e) =>
                    setNewDisaster({ ...newDisaster, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newDisaster.location_name}
                  onChange={(e) =>
                    setNewDisaster({
                      ...newDisaster,
                      location_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newDisaster.description}
                  onChange={(e) =>
                    setNewDisaster({
                      ...newDisaster,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newDisaster.tags}
                  onChange={(e) =>
                    setNewDisaster({ ...newDisaster, tags: e.target.value })
                  }
                  placeholder="flood, emergency, urgent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Create Disaster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
