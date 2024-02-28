  import React from 'react';
  import { Card, CardContent, Typography } from '@material-ui/core';
  import { makeStyles } from '@material-ui/core/styles';

  const useStyles = makeStyles({
    card: {
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
      padding: '20px',
      marginRight: '20px'
    },
    // Define styles for other elements here if needed
  });

  const PageReplacementStats = ({ results }) => {

    const classes = useStyles();

    const total = results.length;
    const hits = results.filter(r => r.hitOrMiss === 'Hit').length;
    const compulsoryMisses = results.filter(r => r.compulsoryOrCapacity === 'Compulsory').length;
    const capacityMisses = results.filter(r => r.compulsoryOrCapacity === 'Capacity').length;
    const misses = total - hits;

    const hitPercentage = ((hits / total) * 100).toFixed(2);
    const compulsoryMissPercentage = ((compulsoryMisses / total) * 100).toFixed(2);
    const capacityMissPercentage = ((capacityMisses / total) * 100).toFixed(2);
    const totalMissPercentage = ((misses / total) * 100).toFixed(2);

    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6">Page Replacement Stats</Typography>
          <Typography>Hit Percentage: {hitPercentage}%</Typography>
          <Typography>Compulsory Miss Percentage: {compulsoryMissPercentage}%</Typography>
          <Typography>Capacity Miss Percentage: {capacityMissPercentage}%</Typography>
          <Typography>Total Miss Percentage: {totalMissPercentage}%</Typography>
        </CardContent>
      </Card>
    );
  };

  export default PageReplacementStats;