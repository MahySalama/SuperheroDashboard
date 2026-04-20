import axios from "axios";

// Base URL of my Django API
// change if my backend runs on a different host/port
// All my endpoints start with http://127.0.0.1:8000/api/
const API_BASE = "http://127.0.0.1:8000/api";

// ------------------------------
// FUNCTION: getStats
// Sends GET request to /stats endpoint
// Returns: marvel_count, dc_count, total_rows, elapsed_time, size_mb
// ------------------------------
export const getStats = async () => {
  // We wait for axios to go to the /stats/ address and come back. 
  // axios.get() sends a GET request to the backend.
  // await means React pauses that function so the website doesn't freeze.
  const response = await axios.get(`${API_BASE}/stats/`);
  // axios stores JSON in response.data
  return response.data;
};

// ------------------------------
// FUNCTION: getMarvel
// Returns: list of Marvel players
// ------------------------------
// We add 'page' as a parameter to tell Django which "chunk" of data we want
export const getMarvel = async (page = 1) => {
  // This sends a request like: /api/marvel/?page=1
  const response = await axios.get(`${API_BASE}/marvel/`, { params: { page } });
  return response.data;
};

// ------------------------------
// FUNCTION: getDC 
// Returns: list of DC players
// ------------------------------
export const getDC = async (page = 1) => {
  const response = await axios.get(`${API_BASE}/dc/`, { params: { page } });
  return response.data;
};

// ------------------------------
// FUNCTION: startInsertion
// Starts background thread in Django
// ------------------------------
export const startInsertion = async () => {
  const response = await axios.get(`${API_BASE}/start/`);
  return response.data;
};

// ------------------------------
// FUNCTION: stopInsertion
// Stops background thread in Django
// ------------------------------
export const stopInsertion = async () => {
  const response = await axios.get(`${API_BASE}/stop/`);
  return response.data;
};
