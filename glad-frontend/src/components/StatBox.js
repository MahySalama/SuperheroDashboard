import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

function StatBox({ label, value, bgcolor }) {
  return (
    <Card sx={{ backgroundColor: bgcolor, color: "white" }}>
      <CardContent>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default StatBox;



