import React from 'react';
import { Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  card: {
    margin: theme.spacing(2),
    overflowX: "auto",
  },
  table: {
    minWidth: 300,
  },
  header: {
    backgroundColor: theme.palette.background.default,
  },
}));

const PageReplacementStats = ({ results }) => {
  const classes = useStyles();

  const total = results.length;
  const hits = results.filter((r) => r.hitOrMiss === 'Hit').length;
  const compulsoryMisses = results.filter((r) => r.compulsoryOrCapacity === 'Compulsory').length;
  const capacityMisses = results.filter((r) => r.compulsoryOrCapacity === 'Capacity').length;
  const misses = total - hits;

  const formatPercentage = (value) => (total ? ((value / total) * 100).toFixed(2) + '%' : '0%');

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography variant="h6">Page Replacement Stats</Typography>
        <Table className={classes.table}>
          <TableHead>
            <TableRow className={classes.header}>
              <TableCell>Metric</TableCell>
              <TableCell align="right">Fraction</TableCell>
              <TableCell align="right">Percent</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row">Hits</TableCell>
              <TableCell align="right">{`${hits} / ${total}`}</TableCell>
              <TableCell align="right">{formatPercentage(hits)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">Compulsory Misses</TableCell>
              <TableCell align="right">{`${compulsoryMisses} / ${total}`}</TableCell>
              <TableCell align="right">{formatPercentage(compulsoryMisses)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">Capacity Misses</TableCell>
              <TableCell align="right">{`${capacityMisses} / ${total}`}</TableCell>
              <TableCell align="right">{formatPercentage(capacityMisses)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">Total Misses</TableCell>
              <TableCell align="right">{`${misses} / ${total}`}</TableCell>
              <TableCell align="right">{formatPercentage(misses)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PageReplacementStats;