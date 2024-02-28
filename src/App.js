import React from 'react';
import './index.css';
import { NumbersProvider } from './NumbersContext';
import NumberInput from './components/NumberInput';
import Grid from '@material-ui/core/Grid';
import DraggableList from './components/DraggableList';
import PageReplacement from './components/FIFOPageReplacement';
import PageReplacementStats from './components/PageReplacementStats';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#556cd6', // Example primary color
    },
    secondary: {
      main: '#19857b', // Example secondary color
    },
    // You can also add error, warning, info, success, and other color types
  },
  // You can also customize typography, breakpoints, etc.
});

class App extends React.Component {
  state = {
    fifoResults: []
  };

  setFifoResults = (results) => {
    this.setState({ fifoResults: results });
  };

  render() {
    return (
      <ThemeProvider theme={theme}>
        <NumbersProvider>
          <div style={{ margin: '20px' }}>
            <h1 style={{ textAlign: 'center', color: 'black', fontSize: '30px', fontFamily: 'Arial' }}>Page Replacement</h1>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <NumberInput />
              </Grid>
              <Grid item xs={12} md={7}>
                <PageReplacement setResults={this.setFifoResults} />
              </Grid>
              <Grid item xs={12} md={5}>
                {/* Nested Grid for Stats and List */}
                <Grid container direction="column" spacing={2}>
                  <Grid item xs={12}>
                    <PageReplacementStats results={this.state.fifoResults} />
                  </Grid>
                  <Grid item xs={12}>
                    <DraggableList />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </div>
        </NumbersProvider>
      </ThemeProvider>
    );
  }
}

export default App;