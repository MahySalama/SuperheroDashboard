import React, { useEffect, useState, useCallback } from "react";
// UI Components for building the structure (Boxes, Grids, Cards)
import {
  Box, Grid, Typography, Button, Card, CardContent,
  TextField, MenuItem, Select, FormControl, InputLabel, Pagination
} from "@mui/material";

import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend
} from "chart.js";

import { getStats, getMarvel, getDC, startInsertion, stopInsertion } from "./api";

import StatBox from "./components/StatBox";
import PlayerTable from "./components/PlayerTable";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function App() {
  // -------------------------------------------------------------------------
  // 1. STATE VARIABLES 
  // -------------------------------------------------------------------------
  
  // Stores the 6 main numbers (Total Marvel, DC, Rows, Time, etc.)
  const [stats, setStats] = useState({
    marvel_count: 0, dc_count: 0, total_rows: 0, elapsed_time: 0, size_mb: 0,
  });

  // Switch: true = timer is running and asking server for updates; false = timer is dead.
  const [isRunning, setIsRunning] = useState(false);

  // Storage lists for players (the 10 rows currently on screen)
  const [marvelPlayers, setMarvelPlayers] = useState([]);
  const [dcPlayers, setDCPlayers] = useState([]);
  
  // Current page numbers for the pagination buttons
  const [marvelPage, setMarvelPage] = useState(1);
  const [dcPage, setDCPage] = useState(1);

  // Total pages needed (Calculated as Total Rows / 10)
  const [marvelTotalPages, setMarvelTotalPages] = useState(1);
  const [dcTotalPages, setDCTotalPages] = useState(1);

  // Filter states: Search text and Height dropdowns for BOTH teams
  const [mSearch, setMSearch] = useState("");
  const [mHeight, setMHeight] = useState("all");
  const [dcSearch, setDCSearch] = useState("");
  const [dcHeight, setDCHeight] = useState("all");

  // ------------------------------------------
  // 2. LOGIC FUNCTIONS 
  // ------------------------------------------

  // FAST FETCH: Gets the small numbers for the colored boxes
  const refreshLiveStats = useCallback(async () => {
    try {
      const statsData = await getStats();
      setStats(statsData); 
    } catch (err) { console.error("Stats fetch failed", err); }
  }, []);

  // SLOW FETCH: Gets the 10 players for the current page
  const fetchTableData = useCallback(async () => {
    try {
      const [marvelResp, dcResp] = await Promise.all([
        getMarvel(marvelPage),
        getDC(dcPage),
      ]);
      
      // Handle Marvel Data + Calculate Total Pages
      if (Array.isArray(marvelResp)) {
        setMarvelPlayers(marvelResp);
        setMarvelTotalPages(1);
      } else {
        setMarvelPlayers(marvelResp.results || []);
        setMarvelTotalPages(Math.ceil((marvelResp.count || 0) / 10) || 1);
      }

      // Handle DC Data + Calculate Total Pages
      if (Array.isArray(dcResp)) {
        setDCPlayers(dcResp);
        setDCTotalPages(1);
      } else {
        setDCPlayers(dcResp.results || []);
        setDCTotalPages(Math.ceil((dcResp.count || 0) / 10) || 1);
      }
    } catch (err) { console.error("Table data failed", err); }
  }, [marvelPage, dcPage]);

  // -------------------------------------------------------------------------
  // 3. THE AUTO-REFRESH ENGINE (The Timer)
  // -------------------------------------------------------------------------

  useEffect(() => {
    refreshLiveStats(); // Fetch once immediately
    
    let interval = null;
    // The "Engine" only runs if isRunning is true (Stop button kills this)
    if (isRunning) {
      interval = setInterval(refreshLiveStats, 2000);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [refreshLiveStats, isRunning]); 

  // Separate effect: Update tables only when user clicks a new page number
  useEffect(() => { fetchTableData(); }, [fetchTableData]);

  // -------------------------------------------------------------------------
  // 4. BUTTON HANDLERS (Start/Stop controls)
  // -------------------------------------------------------------------------
  
  const handleStart = async () => {
    try { 
      await startInsertion(); // Call Django 'Start' API
      setIsRunning(true);     // Turn on the local timer switch
      refreshLiveStats();     
    } catch (err) { console.error("Start failed", err); }
  };

  const handleStop = async () => {
    try { 
      await stopInsertion();  // Call Django 'Stop' API
      setIsRunning(false);    // Turn off the timer switch (freezes the numbers)
      refreshLiveStats();     
    } catch (err) { console.error("Stop failed", err); }
  };

  // -------------------------------------------------------------------------
  // 5. FILTERING & LIMITING (Force 10 Rows)
  // -------------------------------------------------------------------------
  
  const applyFiltersAndLimit = (list, search, height) => {
    return list
      .filter((p) => {
        const nameMatch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const h = Number(p.height);
        let heightMatch = true;
        if (height === ">180") heightMatch = h > 180;
        else if (height === "150-180") heightMatch = h >= 150 && h <= 180;
        else if (height === "<150") heightMatch = h < 150;
        return nameMatch && heightMatch;
      })
      .slice(0, 10); // ABSOLUTE LIMIT: Ensure only 10 rows appear per page
  };

  const filteredMarvel = applyFiltersAndLimit(marvelPlayers, mSearch, mHeight);
  const filteredDC = applyFiltersAndLimit(dcPlayers, dcSearch, dcHeight);

  // BAR CHART DATA: Shows the heights of the 10 players currently on screen
  const barData = {
    labels: [...filteredMarvel, ...filteredDC].slice(0, 10).map(p => p.name),
    datasets: [{ 
      label: "Height (cm)", 
      data: [...filteredMarvel, ...filteredDC].slice(0, 10).map(p => Number(p.height)), 
      backgroundColor: "#1976d2" 
    }],
  };

 
  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      
      {/* Blue Top Header Bar */}
      <Box sx={{ p: 2, bgcolor: "#1565c0", color: "white", mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 1 }}>
        <Typography variant="h5" fontWeight="bold">Gladiator Analytics Dashboard</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" color="success" onClick={handleStart}>▶ Start Generation</Button>
          <Button variant="contained" color="error" onClick={handleStop}>■ Stop Generation</Button>
        </Box>
      </Box>

      {/* Top Row: Charts and Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Left Column: Stacked Bar and Pie Charts */}
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

        {/* Right Column: Grid of 6 Stat Boxes */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><StatBox label="Marvel" value={stats.marvel_count} bgcolor="#1976d2" /></Grid>
            <Grid item xs={6} md={3}><StatBox label="DC" value={stats.dc_count} bgcolor="#f44336" /></Grid>
            <Grid item xs={12} md={6}><StatBox label="Total Rows" value={stats.total_rows} bgcolor="#00897b" /></Grid>
            <Grid item xs={4} md={4}><StatBox label="Time Elapsed" value={stats.elapsed_time} bgcolor="#7b1fa2" /></Grid>
            <Grid item xs={4} md={4}><StatBox label="Size (MB)" value={stats.size_mb} bgcolor="#fb8c00" /></Grid>
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
        <PlayerTable players={filteredMarvel} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
           <Pagination count={marvelTotalPages} page={marvelPage} onChange={(e, v) => setMarvelPage(v)} color="primary" />
        </Box>
      </Box>

      {/* DC TABLE SECTION */}
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







