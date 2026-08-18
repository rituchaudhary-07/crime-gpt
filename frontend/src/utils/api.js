const getApiBaseUrl = () => {
  // 1. Explicitly configured VITE_API_URL environment variable takes top priority
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }

  // 2. Production browser runtime fallback (non-localhost)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    if (!isLocalhost) {
      // Relative /api path in production prevents HTTPS/HTTP mixed-content & hardcoded localhost failures
      return `${window.location.origin}/api`;
    }
  }

  // 3. Development fallback for local FastAPI server
  return "http://127.0.0.1:8000/api";
};

const API_BASE_URL = getApiBaseUrl();
const API_HEALTH_URL = API_BASE_URL.replace(/\/api$/, "") + "/health";

export class ApiRequestError extends Error {
  constructor(message, { status, code, requestId } = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

const formatErrorMessage = (detail, fallbackMessage, status) => {
  if (!detail) return `${fallbackMessage} (HTTP ${status})`;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg || JSON.stringify(item)).join("; ");
  }
  if (typeof detail === "object") {
    const nestedDetail = detail.detail ?? detail.message ?? detail.error;
    return nestedDetail
      ? formatErrorMessage(nestedDetail, fallbackMessage, status)
      : JSON.stringify(detail);
  }
  return String(detail);
};

const requestJson = async (url, options, fallbackMessage) => {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs || 45000;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const requestId = response.headers.get("x-request-id");
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // A proxy/server can return a non-JSON error page; preserve the HTTP detail below.
    }

    if (!response.ok) {
      if (response.status === 401) {
        api.logout();
        if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/") {
          window.location.href = "/login?expired=1";
        }
      }
      const errStr = formatErrorMessage(payload?.detail, fallbackMessage, response.status);
      throw new ApiRequestError(
        errStr,
        { status: response.status, code: "http_error", requestId }
      );
    }
    return payload;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (error.name === "AbortError") {
      throw new ApiRequestError("The server request timed out. Please retry your inquiry.", { code: "timeout" });
    }
    if (!navigator.onLine) {
      throw new ApiRequestError("You appear to be offline. Reconnect and retry the request.", { code: "offline" });
    }
    throw new ApiRequestError(
      `Could not reach ${API_BASE_URL}. Confirm the API URL, server port, and CORS origin configuration.`,
      { code: "network_or_cors" }
    );
  } finally {
    window.clearTimeout(timeout);
  }
};

// Helper to get auth headers
const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {
  apiBaseUrl: API_BASE_URL,

  checkHealth: async () => {
    const rootUrl = API_BASE_URL.replace(/\/api$/, "");
    const candidateUrls = [
      `${API_BASE_URL}/health`,
      `${rootUrl}/health`,
      `${rootUrl}/api/health`,
      `${rootUrl}/openapi.json`,
      `${rootUrl}/docs`
    ];

    const probeUrls = [...new Set(candidateUrls)];

    for (const probeUrl of probeUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(probeUrl, {
          method: "GET",
          headers: { Accept: "application/json, text/html" },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (response.ok) {
          return { status: "ok", url: probeUrl };
        }
      } catch (e) {
        // Probe next endpoint candidate
      }
    }

    throw new ApiRequestError(
      `Could not reach backend API at ${API_BASE_URL}. Confirm the backend service is running.`,
      { code: "network_or_cors" }
    );
  },
  // Authentication
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Authentication failed");
    }
    
    const data = await response.json();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("username", data.username);
    return data;
  },
  
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
    }
    return response.json();
  },
  
  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to process forgot password request");
    }
    return response.json();
  },

  verifyOTP: async (email, otp) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, otp })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Invalid or expired OTP");
    }
    return response.json();
  },

  resetPassword: async (email, otp, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, otp, new_password: newPassword })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Password reset failed");
    }
    return response.json();
  },
  
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Session expired");
    return response.json();
  },
  
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    return !!token && token !== "null" && token !== "undefined";
  },
  
  getUserRole: () => {
    return localStorage.getItem("role") || "officer";
  },
  
  getUsername: () => {
    return localStorage.getItem("username") || "";
  },

  // Notifications
  getNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load notifications");
    return response.json();
  },

  markNotificationRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: "PUT",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to update notification");
    return response.json();
  },

  dismissNotification: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!response.ok) {
      let msg = "Failed to dismiss notification";
      try {
        const err = await response.json();
        msg = err.detail || msg;
      } catch (e) {}
      throw new Error(msg);
    }
    return response.json();
  },

  markAllNotificationsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PUT",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to clear notifications");
    return response.json();
  },

  // Autocomplete & Search
  locationAutocomplete: async (query) => {
    const response = await fetch(`${API_BASE_URL}/locations/autocomplete?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch location suggestions");
    return response.json();
  },

  globalSearch: async (query) => {
    const response = await fetch(`${API_BASE_URL}/search/global?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Global search failed");
    return response.json();
  },

  // Cases
  getCases: async () => {
    const res = await requestJson(`${API_BASE_URL}/cases`, {
      method: "GET",
      headers: getHeaders()
    }, "Unable to load active case files");
    return Array.isArray(res) ? res : (res?.cases || []);
  },
  
  getCase: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load case details");
    return response.json();
  },

  getArchivedCases: async () => {
    try {
      const res = await requestJson(`${API_BASE_URL}/cases/archive`, {
        method: "GET",
        headers: getHeaders()
      }, "Unable to load archived case files");
      return Array.isArray(res) ? res : (res?.cases || []);
    } catch (err) {
      if (err.status === 404) {
        const res = await requestJson(`${API_BASE_URL}/cases/archived`, {
          method: "GET",
          headers: getHeaders()
        }, "Unable to load archived case files");
        return Array.isArray(res) ? res : (res?.cases || []);
      }
      throw err;
    }
  },

  restoreCase: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/restore`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to restore case");
    return response.json();
  },
  
  createCase: async (caseData) => {
    const response = await fetch(`${API_BASE_URL}/cases`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(caseData)
    });
    if (!response.ok) throw new Error("Failed to create case");
    return response.json();
  },
  
  updateCase: async (caseId, caseData) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(caseData)
    });
    if (!response.ok) throw new Error("Failed to update case");
    return response.json();
  },

  updateCaseStatus: async (caseId, status) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error("Failed to update case status");
    return response.json();
  },
  
  deleteCase: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete case");
    return response.json();
  },
  
  // RAG / AI Analysis
  intakeCheck: async (intakeData) => {
    const customKey = localStorage.getItem("gemini_api_key") || "";
    const response = await fetch(`${API_BASE_URL}/cases/intake`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ ...intakeData, custom_key: customKey })
    });
    if (!response.ok) throw new Error("Intake checker failed");
    return response.json();
  },

  analyzeCase: async (caseId) => {
    const customKey = localStorage.getItem("gemini_api_key") || "";
    let url = `${API_BASE_URL}/cases/${caseId}/analyze`;
    if (customKey) {
      url += `?custom_key=${encodeURIComponent(customKey)}`;
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("AI analysis process failed");
    return response.json();
  },
  
  getFIRDraft: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/fir-draft`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load FIR draft");
    return response.json();
  },

  updateFIRDraft: async (caseId, draftData) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/fir-draft`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(draftData)
    });
    if (!response.ok) throw new Error("Failed to update FIR draft");
    return response.json();
  },

  // Evidence
  getEvidenceList: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/evidence`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load evidence checklist");
    return response.json();
  },

  uploadEvidenceFile: async (caseId, file, custodyNotes = "") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("custody_notes", custodyNotes);
    
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/evidence/upload`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData
    });
    if (!response.ok) throw new Error("Failed to upload evidence");
    return response.json();
  },

  updateEvidenceItem: async (caseId, itemId, fileType, custodyNotes) => {
    const params = new URLSearchParams();
    params.append("file_type", fileType);
    params.append("custody_notes", custodyNotes);
    
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/evidence/${itemId}?${params.toString()}`, {
      method: "PUT",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to update evidence item");
    return response.json();
  },

  deleteEvidenceItem: async (caseId, itemId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/evidence/${itemId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete evidence item");
    return response.json();
  },

  // SOP Guidance Chat
  sopChat: async (caseId, message) => {
    const customKey = localStorage.getItem("gemini_api_key") || "";
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/sop-chat`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message, custom_key: customKey })
    });
    if (!response.ok) throw new Error("SOP Chat failed");
    return response.json();
  },

  // Conversations API (ChatGPT / Gemini Threads)
  getConversations: async () => {
    return requestJson(`${API_BASE_URL}/conversations`, {
      method: "GET",
      headers: getHeaders()
    }, "Unable to load conversation history");
  },

  createConversation: async (title = "New Inquiry Thread") => {
    return requestJson(`${API_BASE_URL}/conversations`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title })
    }, "Failed to create new conversation");
  },

  getConversation: async (convId) => {
    return requestJson(`${API_BASE_URL}/conversations/${convId}`, {
      method: "GET",
      headers: getHeaders()
    }, "Failed to fetch conversation details");
  },

  sendMessageToConversation: async (convId, message, mode = "legal_research") => {
    const customKey = localStorage.getItem("gemini_api_key") || "";
    let targetId = convId;
    if (!targetId || targetId === "null" || targetId === "undefined") {
      try {
        const newSession = await api.createConversation("New Inquiry Thread");
        targetId = newSession.session_id || newSession.id || newSession._id;
      } catch (e) {
        return api.generalChat(message, null, mode);
      }
    }
    return requestJson(`${API_BASE_URL}/conversations/${targetId}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message, session_id: targetId, mode, custom_key: customKey })
    }, "Failed to send message to conversation");
  },

  renameConversation: async (convId, title) => {
    return requestJson(`${API_BASE_URL}/conversations/${convId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ title })
    }, "Failed to rename conversation");
  },

  deleteConversation: async (convId) => {
    return requestJson(`${API_BASE_URL}/conversations/${convId}`, {
      method: "DELETE",
      headers: getHeaders()
    }, "Failed to delete conversation");
  },

  // Legacy Chat Sessions Aliases
  getChatSessions: async () => {
    return api.getConversations();
  },

  createChatSession: async (title = "New Inquiry Thread") => {
    return api.createConversation(title);
  },

  renameChatSession: async (sessionId, title) => {
    return api.renameConversation(sessionId, title);
  },

  deleteChatSession: async (sessionId) => {
    return api.deleteConversation(sessionId);
  },

  getSessionMessages: async (sessionId) => {
    const conversation = await api.getConversation(sessionId);
    return conversation.messages || [];
  },

  // General Legal Q&A Assistant Chat
  generalChat: async (message, sessionId = null, mode = "legal_research") => {
    const customKey = localStorage.getItem("gemini_api_key") || "";
    const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message, session_id: sessionId, custom_key: customKey, mode })
    });
    if (!response.ok) {
      let errMsg = "Assistant Q&A failed";
      try {
        const errData = await response.json();
        errMsg = errData.detail || errMsg;
      } catch (e) {}
      throw new Error(`${errMsg} (HTTP ${response.status})`);
    }
    return response.json();
  },

  exportChatPDF: async (chatMessages, caseTitle = "AI Investigation Assistant Log") => {
    const response = await fetch(`${API_BASE_URL}/chat/export-pdf`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ chat_messages: chatMessages, case_title: caseTitle })
    });
    if (!response.ok) throw new Error("Failed to export chat PDF");
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `NyayaIQ_Chat_Transcript_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  uploadChatAttachment: async (file, signal = null) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
      signal: signal
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to upload chat attachment");
    }
    return response.json();
  },

  // Unified History System
  getHistory: async (actionType = "all", query = "") => {
    let url = `${API_BASE_URL}/history?action_type=${actionType}`;
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch history items");
    return response.json();
  },

  deleteHistoryItem: async (itemId) => {
    const response = await fetch(`${API_BASE_URL}/history/${itemId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete history item");
    return response.json();
  },

  clearAllHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to clear history log");
    return response.json();
  },

  // Legacy Chat History
  getChatHistory: async (caseId = null, messageType = "general_assistant") => {
    let url = `${API_BASE_URL}/chat/history?message_type=${messageType}`;
    if (caseId) {
      url += `&case_id=${caseId}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch chat logs");
    return response.json();
  },

  // Legal Search & Mapping
  searchLaws: async (query) => {
    const customKey = localStorage.getItem("gemini_api_key") || "";
    const response = await fetch(`${API_BASE_URL}/legal/search?query=${encodeURIComponent(query)}&api_key=${encodeURIComponent(customKey)}`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Legal search failed");
    return response.json();
  },

  getLegalMapping: async (query = "") => {
    let url = `${API_BASE_URL}/legal/mapping`;
    if (query) {
      url += `?query=${encodeURIComponent(query)}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to retrieve legal mappings");
    return response.json();
  },

  // Downloads
  downloadPDF: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/export/pdf`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to export PDF report");
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `NyayaIQ_Report_${caseId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  
  downloadDocx: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/export/docx`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to export DOCX report");
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `NyayaIQ_Report_${caseId}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  
  // Settings API key validation
  validateAPIKey: async (apiKey) => {
    const response = await fetch(`${API_BASE_URL}/settings/validate-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ api_key: apiKey })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "API Key check failed");
    }
    return response.json();
  },
  
  // Admin Endpoints
  getStats: async () => {
    return requestJson(`${API_BASE_URL}/admin/stats`, {
      method: "GET",
      headers: getHeaders()
    }, "Unable to load dashboard statistics");
  },
  
  getLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/logs`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load audit logs");
    return response.json();
  },
  
  getOfficers: async () => {
    try {
      const res = await requestJson(`${API_BASE_URL}/officers`, {
        method: "GET",
        headers: getHeaders()
      }, "Unable to load officers list");
      return Array.isArray(res) ? res : (res?.officers || []);
    } catch (e) {
      return [];
    }
  },

  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load users list");
    return response.json();
  },

  getPendingUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/pending-users`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load pending registrations");
    return response.json();
  },

  updateOfficerStatus: async (userId, status) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to update officer status");
    }
    return response.json();
  },

  approveUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to approve user");
    }
    return response.json();
  },

  rejectUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reject`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to reject user");
    }
    return response.json();
  },

  toggleUserStatus: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-status`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to toggle user status");
    }
    return response.json();
  },

  unlockUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/unlock`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to unlock user account");
    }
    return response.json();
  },

  adminResetPassword: async (userId, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ new_password: newPassword })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Password reset failed");
    }
    return response.json();
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Password change failed");
    }
    return response.json();
  },

  // Case Assignment Workflow
  assignCase: async (caseId, officerId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/assign`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ officer_id: officerId })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to assign case");
    }
    return response.json();
  },

  respondCaseAssignment: async (caseId, action, reason = "") => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/respond-assignment`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ action, reason })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to respond to case assignment");
    }
    return response.json();
  },

  acceptCase: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/accept`, {
      method: "POST",
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to accept case investigation");
    }
    return response.json();
  },

  declineCase: async (caseId, reason) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/decline`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to decline case investigation");
    }
    return response.json();
  },

  deleteChatHistory: async (chatId) => {
    const response = await fetch(`${API_BASE_URL}/chat/history/${chatId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to delete chat entry");
    }
    return response.json();
  }
};
