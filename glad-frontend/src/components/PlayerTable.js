import React from "react";

function PlayerTable({ players }) {
  return (
    <table
      style={{
        width: "100%",
        marginTop: "10px",
        borderCollapse: "collapse",
        backgroundColor: "white",
      }}
    >
      <thead>
        <tr>
          <th style={thStyle}>Name</th>
          <th style={thStyle}>Height (cm)</th>
          <th style={thStyle}>Weight</th>
          <th style={thStyle}>Games</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => (
          <tr key={player.id}>
            <td style={tdStyle}>{player.name}</td>
            <td style={tdStyle}>{player.height}</td>
            <td style={tdStyle}>{player.weight}</td>
            <td style={tdStyle}>{player.games_played}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle = {
  borderBottom: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#eeeeee",
};

const tdStyle = {
  borderBottom: "1px solid #f0f0f0",
  padding: "8px",
};

export default PlayerTable;

