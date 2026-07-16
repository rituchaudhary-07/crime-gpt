const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
  
  register: async (username, password, badgeNumber = "", role = "officer") => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, password, badge_number: badgeNumber, role })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
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
    return !!localStorage.getItem("token");
  },
  
  getUserRole: () => {
    return localStorage.getItem("role") || "officer";
  },
  
  getUsername: () => {
    return localStorage.getItem("username") || "";
  },

  // Cases
  getCases: async () => {
    const response = await fetch(`${API_BASE_URL}/cases`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load cases");
    return response.json();
  },
  
  getCase: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load case details");
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
  
  deleteCase: async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete case");
    return response.json();
  },
  
  // RAG / AI Analysis
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
    link.download = `CrimeGPT_Report_${caseId}.pdf`;
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
    link.download = `CrimeGPT_Report_${caseId}.docx`;
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
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch statistics");
    return response.json();
  },
  
  getLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/logs`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load audit logs");
    return response.json();
  },
  
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to load users list");
    return response.json();
  }
};
