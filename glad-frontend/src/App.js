import React, { useEffect, useState, useCallback } from "react";
// Material UI Components for building the structure (Boxes, Grids, Cards)
import {
  Box, Grid, Typography, Button, Card, CardContent,
  TextField, MenuItem, Select, FormControl, InputLabel, Pagination
} from "@mui/material";

// Import Chart components to visualize the data
import { Pie, Bar } from "react-chartjs-2";

// Import core ChartJS logic required to make the charts actually draw
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend
} from "chart.js";

// Import the communication functions that talk to your backend server
import { getStats, getMarvel, getDC, startInsertion, stopInsertion } from "./api";

// Import my custom reusable UI components
import StatBox from "./components/StatBox";
import PlayerTable from "./components/PlayerTable";

// Register the chart elements so ChartJS knows how to render Bars and Pies
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function App() {
  // -------------------------------------------------------------------------
  // 1. STATE VARIABLES (React memory: when these change, the UI re-renders)
  // -------------------------------------------------------------------------
  
  // stats: Stores the numeric data (counts, size, time) as an object
  const [stats, setStats] = useState({
    marvel_count: 0, dc_count: 0, total_rows: 0, elapsed_time: 0, size_mb: 0,
  });

   // isRunning: A boolean (true/false) to track if the data generation is active
  const [isRunning, setIsRunning] = useState(false);

  // Storage lists for players (the 10 rows currently on screen)
  // marvelPlayers / dcPlayers variables: Arrays that hold the list of characters fetched from the API
  const [marvelPlayers, setMarvelPlayers] = useState([]);
  const [dcPlayers, setDCPlayers] = useState([]);
  
  // Current page numbers for the pagination buttons
  // marvelPage / dcPage variables: Tracks which page number the user is currently looking at
  const [marvelPage, setMarvelPage] = useState(1);
  const [dcPage, setDCPage] = useState(1);

  // Tracks how many pages exist in total based on the database size
  // Total pages needed (Calculated as Total Rows / 10)
  const [marvelTotalPages, setMarvelTotalPages] = useState(1);
  const [dcTotalPages, setDCTotalPages] = useState(1);

  // Filter states: Search text and Height dropdowns for BOTH teams
  // Strings to store what the user types or selects in the filters
  const [mSearch, setMSearch] = useState("");       // Marvel search text
  const [mHeight, setMHeight] = useState("all");    // Marvel height dropdown
  const [dcSearch, setDCSearch] = useState("");     // DC search text
  const [dcHeight, setDCHeight] = useState("all");  // DC height dropdown

  // ------------------------------------------
  // 2. LOGIC FUNCTIONS 
  // ------------------------------------------

  // FAST FETCH: Gets the small numbers for the colored boxes can afford to run it every 2 seconds 
  // without slowing down my internet or my computer
  // because refreshLiveStats is a function called inside useEffect that is run
  const refreshLiveStats = useCallback(async () => {     
    try {
      const statsData = await getStats();
      setStats(statsData); 
    } catch (err) { console.error("Stats fetch failed", err); }
  }, []);  // [] means "define this function once and never recreate it"

  // fetchTableData - SLOW FETCH: Fetches the actual player lists for the tables
  // Gets the 10 players for the current page
  const fetchTableData = useCallback(async () => {
    try {
      // Promise.all runs both API calls at the same time to save time
      const [marvelResp, dcResp] = await Promise.all([
        getMarvel(marvelPage),  // Fetch Marvel players for the current page
        getDC(dcPage),          // Fetch DC players for the current page
      ]);
      
      // Handle Marvel Data + Calculate Total Pages
      // If the API returns a simple array, set it and default to 1 page
      if (Array.isArray(marvelResp)) {
        setMarvelPlayers(marvelResp);
        setMarvelTotalPages(1);
      } else {
        // If API returns an object (with count), calculate total pages (10 players per page)
        setMarvelPlayers(marvelResp.results || []);
        setMarvelTotalPages(Math.ceil((marvelResp.count || 0) / 10) || 1);
      }

      // Same logic for DC Data
      // Handle DC Data + Calculate Total Pages
      if (Array.isArray(dcResp)) {
        setDCPlayers(dcResp);
        setDCTotalPages(1);
      } else {
        setDCPlayers(dcResp.results || []);
        setDCTotalPages(Math.ceil((dcResp.count || 0) / 10) || 1);
      }
    } catch (err) { console.error("Table data failed", err); }
  }, [marvelPage, dcPage]); // [marvelPage, dcPage] means "Redefine this function only if the page numbers change"

  // -------------------------------------------------------------------------
  // 3. THE AUTO-REFRESH ENGINE (The Timer)
  // -------------------------------------------------------------------------

  useEffect(() => {
    refreshLiveStats(); // Run once immediately when the app loads
    
    let interval = null;
    // If the 'Start' button was clicked, start a timer that runs every 2 seconds
    if (isRunning) {
      interval = setInterval(refreshLiveStats, 2000);
    }

    // Clean-up: If the component closes or isRunning changes, stop the timer
    return () => { if (interval) clearInterval(interval); };
  }, [refreshLiveStats, isRunning]);   // Re-run this logic if start/stop is toggled

  // Separate effect: Update tables only when user clicks a new page number (page numbers changes)
  useEffect(() => { fetchTableData(); }, [fetchTableData]);

  // -------------------------------------------------------------------------
  // 4. BUTTON HANDLERS (Start/Stop controls)
  // -------------------------------------------------------------------------
  
  const handleStart = async () => {
    try { 
      await startInsertion(); // Call Django 'Start' API
      setIsRunning(true);     // Turn on the local timer switch, Update state so the 2-second timer starts locally
      refreshLiveStats();     // Get the first set of numbers immediately 
    } catch (err) { console.error("Start failed", err); }
  };

  const handleStop = async () => {
    try { 
      await stopInsertion();  // Call Django 'Stop' API
      setIsRunning(false);    // Turn off the timer switch (freezes the numbers), Stop our local 2-second timer
      refreshLiveStats();     // Get final numbers 
    } catch (err) { console.error("Stop failed", err); }
  };

  // -------------------------------------------------------------------------
  // 5. FILTERING & LIMITING (Force 10 Rows)
  // -------------------------------------------------------------------------
  // A helper function to filter the list based on Search and Height dropdowns
  const applyFiltersAndLimit = (list, search, height) => {
    return list
      .filter((p) => {
        // Does the name match the search box? (Case insensitive)
        const nameMatch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const h = Number(p.height);  // Convert height string to number
        let heightMatch = true;
        // Check which dropdown option is selected and filter accordingly
        if (height === ">180") heightMatch = h > 180;
        else if (height === "150-180") heightMatch = h >= 150 && h <= 180;
        else if (height === "<150") heightMatch = h < 150;
        return nameMatch && heightMatch;
      })
      .slice(0, 10); // ABSOLUTE LIMIT: Ensure only 10 rows appear per page
  };

  // Run the filtering logic for both teams
  const filteredMarvel = applyFiltersAndLimit(marvelPlayers, mSearch, mHeight);
  const filteredDC = applyFiltersAndLimit(dcPlayers, dcSearch, dcHeight);

  // BAR CHART DATA: Shows the heights of the 10 players currently on screen
  const barData = {
    labels: [...filteredMarvel, ...filteredDC].slice(0, 10).map(p => p.name), // Names on X-axis
    datasets: [{ 
      label: "Height (cm)", 
      data: [...filteredMarvel, ...filteredDC].slice(0, 10).map(p => Number(p.height)),  // Heights on Y-axis
      backgroundColor: "#1976d2"  // Blue color for bars
    }],
  };

  // -------------------------------------------------------------------------
  // 6. UI RENDERING (The HTML-like structure)
  // -------------------------------------------------------------------------
 
  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      
      {/* Top Blue Header Bar */}
      <Box sx={{ p: 2, bgcolor: "#1565c0", color: "white", mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 1 }}>
        <Typography variant="h5" fontWeight="bold">Gladiator Analytics Dashboard</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" color="success" onClick={handleStart}>▶ Start Generation</Button>
          <Button variant="contained" color="error" onClick={handleStop}>■ Stop Generation</Button>
        </Box>
      </Box>

      {/* Grid for Charts and Stat Boxes */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Left Side: Stacked Bar and Pie Charts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}><CardContent>
            <Typography variant="h6" gutterBottom>Height Comparison</Typography>
            <Box sx={{ height: 180 }}>
              <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </Box>
          </CardContent></Card>
          
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Team Balance</Typography>
            <Box sx={{ height: 180 }}>
              <Pie data={{ 
                labels: ["Marvel", "DC"], 
                datasets: [{ data: [stats.marvel_count, stats.dc_count], backgroundColor: ["#1976d2", "#f44336"] }] 
              }} options={{ maintainAspectRatio: false }} />
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Right Side: Grid of 6 Stat Boxes */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><StatBox label="Marvel" value={stats.marvel_count} bgcolor="#1976d2" /></Grid>
            <Grid item xs={6} md={3}><StatBox label="DC" value={stats.dc_count} bgcolor="#f44336" /></Grid>
            <Grid item xs={12} md={6}><StatBox label="Total Rows" value={stats.total_rows} bgcolor="#00897b" /></Grid>
            <Grid item xs={4} md={4}><StatBox label="Time Elapsed" value={stats.elapsed_time} bgcolor="#7b1fa2" /></Grid>
            <Grid item xs={4} md={4}><StatBox label="Size (MB)" value={stats.size_mb} bgcolor="#fb8c00" /></Grid>
            {/* Shows the Marvel to DC ratio as a string */}
            <Grid item xs={4} md={4}><StatBox label="Ratio" value={`${stats.marvel_count}/${stats.dc_count}`} bgcolor="#43a047" /></Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* MARVEL TABLE SECTION */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">Marvel Team (10 per page)</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}><TextField fullWidth label="Search" value={mSearch} onChange={(e) => setMSearch(e.target.value)} /></Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth><InputLabel>Height</InputLabel>
              <Select label="Height" value={mHeight} onChange={(e) => setMHeight(e.target.value)}>
                <MenuItem value="all">All</MenuItem><MenuItem value=">180">&gt; 180</MenuItem><MenuItem value="150-180">150-180</MenuItem><MenuItem value="<150">&lt; 150</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        {/* The Actual Table Component */}
        <PlayerTable players={filteredMarvel} />
        {/* Pagination Buttons for Marvel */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
           <Pagination count={marvelTotalPages} page={marvelPage} onChange={(e, v) => setMarvelPage(v)} color="primary" />
        </Box>
      </Box>

      {/* DC Table Section (Identical logic to Marvel) */}
      <Box sx={{ mt: 6, mb: 10 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">DC Team (10 per page)</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}><TextField fullWidth label="Search" value={dcSearch} onChange={(e) => setDCSearch(e.target.value)} /></Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth><InputLabel>Height</InputLabel>
              <Select label="Height" value={dcHeight} onChange={(e) => setDCHeight(e.target.value)}>
                <MenuItem value="all">All</MenuItem><MenuItem value=">180">&gt; 180</MenuItem><MenuItem value="150-180">150-180</MenuItem><MenuItem value="<150">&lt; 150</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <PlayerTable players={filteredDC} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
           <Pagination count={dcTotalPages} page={dcPage} onChange={(e, v) => setDCPage(v)} color="primary" />
        </Box>
      </Box>
    </Box>
  );
}

export default App;


/*
What is useCallback?
In React, every time a piece of State changes (like a timer ticking), the entire App() function runs again from top to bottom.
Normally, if you write a function inside App():

const myFunction = () => { ... }

React deletes and recreates that function every single time the component re-renders. 
This can cause performance issues or trigger useEffect loops unnecessarily.
useCallback tells React: "Hey, cache (memoize) this function. 
Don't create a new version of it unless the variables I put in the [] array change.
"
useCallback(..., []): "Create this function once when the app starts. Never recreate it." (Used for refreshLiveStats).
useCallback(..., [marvelPage]): "Only recreate this function if the marvelPage number changes."
Why do you need it here?
Because you are using these functions inside useEffect. If you didn't use useCallback, your useEffect would think the function is "new" every 2 seconds, 
causing the app to restart the timer or fetch data over and over in an infinite loop.
*/






