import React, { useState, useContext, useEffect } from 'react';
import { NumbersContext } from '../NumbersContext';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Button } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    numberInput: {
        width: '50%', // Adjust width as per requirement
    },
    button: {
        minWidth: '10%', // Adjust width for buttons
    },
    actionArea: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing(2),
    },
    table: {
        minHeight: '400px', // Adjust as needed
        border: '1px solid #ddd', // Add a border around the table
        backgroundColor: '#28EEFF',
        padding: theme.spacing(1), // Optional padding around the table
    },
    pageNumberCell: {
        width: '20%', // Adjust as needed
    },
    cacheCell: {
        width: '30%', // Adjust as needed
    },
    tableCell: {
        border: '2px solid #4f43f0 ', // Add right border to each cell
        borderBottom: '2px solid #4f43f0', // Add bottom border to each cell
    },
    inactiveButton: {
        color: '#c0c0c0', // Grey color
        '&:hover': {
            backgroundColor: '#f5f5f5', // Slightly change hover background to indicate the button is still active
        },
    },
}));

function fifoPageReplacement(pages, cacheSize) {
    let cache = [];
    let results = [];
    let hits = 0;
    let misses = 0;

    for (let page of pages) {
        let hitOrMiss = '';
        let compulsoryOrCapacity = '';

        // Check if the page is already in the cache
        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
            hits++;
        } else {
            hitOrMiss = 'Miss';
            misses++;

            // Determine if it's a compulsory or capacity miss
            compulsoryOrCapacity = (cache.length < cacheSize) ? 'Compulsory' : 'Capacity';

            // If cache is full, remove the oldest item
            if (cache.length >= cacheSize) {
                cache.shift();
            }

            // Add the new page to the cache
            cache.push(page);
        }

        // Save the result for this iteration
        results.push({ page, hitOrMiss, compulsoryOrCapacity, cache: [...cache] });
    }

    return { results, hits, misses };
}

function mruPageReplacement(pages, cacheSize) {
    let cache = [];
    let results = [];
    let cachePositions = new Map();

    pages.forEach((page, index) => {
        let hitOrMiss = '';
        let compulsoryOrCapacity = '';

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
            cachePositions.set(page, index); // Update position with current index
        } else {
            hitOrMiss = 'Miss';
            compulsoryOrCapacity = (cache.length < cacheSize) ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                // Find MRU page and replace it
                let mru = [...cachePositions.entries()].reduce((mru, entry) => entry[1] > mru[1] ? entry : mru);
                cachePositions.delete(mru[0]);
                cache[cache.indexOf(mru[0])] = page;
            } else {
                cache.push(page);
            }

            cachePositions.set(page, index); // Set position
        }

        results.push({ page, hitOrMiss, compulsoryOrCapacity, cache: [...cache] });
    });

    return { results };
}



function lruPageReplacement(pages, cacheSize) {
    let cache = [];
    let results = [];
    let cachePositions = new Map();

    pages.forEach((page, index) => {
        let hitOrMiss = '';
        let compulsoryOrCapacity = '';

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
            cachePositions.set(page, index); // Update position with current index
        } else {
            hitOrMiss = 'Miss';
            compulsoryOrCapacity = (cache.length < cacheSize) ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                // Find LRU page and replace it
                let lru = [...cachePositions.entries()].reduce((lru, entry) => entry[1] < lru[1] ? entry : lru);
                cachePositions.delete(lru[0]);
                cache[cache.indexOf(lru[0])] = page;
            } else {
                cache.push(page);
            }

            cachePositions.set(page, pages.indexOf(page)); // Set position
        }

        results.push({ page, hitOrMiss, compulsoryOrCapacity, cache: [...cache] });
    });

    return { results };
}

function mfuPageReplacement(pages, cacheSize) {
    let cache = [];
    let usageCounts = new Map(); // Use a map to track the frequency of each page
    let results = [];
    let pageIndexes = new Map(); // Track the last access index of each page for tie-breaking

    pages.forEach((page, index) => {
        let hitOrMiss = "Miss";
        let compulsoryOrCapacity = "Compulsory";

        // Update frequency
        usageCounts.set(page, (usageCounts.get(page) || 0) + 1);
        pageIndexes.set(page, index); // Update the last access index

        if (cache.includes(page)) {
            hitOrMiss = "Hit";
            compulsoryOrCapacity = ""; // No miss type on a hit
        } else {
            if (cache.length >= cacheSize) {
                compulsoryOrCapacity = "Capacity";
                // Find the most frequently used page
                let mfuPage = [...cache].sort((a, b) => {
                    const freqCompare = usageCounts.get(b) - usageCounts.get(a);
                    if (freqCompare === 0) { // If frequencies are equal, compare indexes
                        return pageIndexes.get(a) - pageIndexes.get(b);
                    }
                    return freqCompare;
                })[0];

                // Evict the MFU page
                cache.splice(cache.indexOf(mfuPage), 1);
            }

            cache.push(page);
        }

        // Clone the cache for the current state
        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache] // Ensure this is always an array
        });
    });

    return { results };
}

function lfuPageReplacement(pages, cacheSize) {
    let cache = [];
    let accessFrequency = new Map(); // Use a map to track frequency of each page
    let results = [];
    let pageIndexes = new Map(); // Track the last access index of each page

    pages.forEach((page, index) => {
        let hitOrMiss = "Miss";
        let compulsoryOrCapacity = "Compulsory";

        // Update frequency
        accessFrequency.set(page, (accessFrequency.get(page) || 0) + 1);
        pageIndexes.set(page, index); // Update the last access index

        if (cache.includes(page)) {
            hitOrMiss = "Hit";
            compulsoryOrCapacity = ""; // No miss type on a hit
        } else {
            if (cache.length >= cacheSize) {
                compulsoryOrCapacity = "Capacity";
                // Find the least frequently used page
                let lfuPage = [...cache].sort((a, b) => {
                    const freqCompare = accessFrequency.get(a) - accessFrequency.get(b);
                    if (freqCompare === 0) { // If frequencies are equal, compare indexes
                        return pageIndexes.get(a) - pageIndexes.get(b);
                    }
                    return freqCompare;
                })[0];

                // Evict the LFU page
                cache.splice(cache.indexOf(lfuPage), 1);
            }

            cache.push(page);
        }

        // Clone the cache for the current state
        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache] // Ensure this is always an array
        });
    });

    return { results };
}

function minPageReplacement(pages, cacheSize) {
    let cache = [];
    let futureUses = {};
    let results = [];
    let hits = 0;
    let misses = 0;

    // Preprocess pages to determine future uses
    for (let i = pages.length - 1; i >= 0; i--) {
        if (!futureUses.hasOwnProperty(pages[i])) {
            futureUses[pages[i]] = [];
        }
        futureUses[pages[i]].unshift(i); // Prepend the index (simulate future use)
    }

    for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        let hitOrMiss = '';
        let compulsoryOrCapacity = '';

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
            hits++;
        } else {
            hitOrMiss = 'Miss';
            misses++;
            compulsoryOrCapacity = cache.length < cacheSize ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                // Determine which cache page will be used last in the future
                let maxDistance = -1, pageToReplace = null;
                cache.forEach((p) => {
                    if (futureUses[p].length === 0 || futureUses[p][0] > maxDistance) {
                        pageToReplace = p;
                        maxDistance = futureUses[p][0] || Number.MAX_SAFE_INTEGER;
                    }
                });

                // Replace the page that will not be used for the longest time
                cache = cache.filter((p) => p !== pageToReplace);
            }

            cache.push(page);
        }

        // Remove the current usage from future uses
        if (futureUses[page].length > 0) {
            futureUses[page].shift();
        }

        results.push({ page, hitOrMiss, compulsoryOrCapacity, cache: [...cache] });
    }

    return { results, hits, misses };
}

const PageReplacement = ({ setResults }) => {
    const classes = useStyles();
    const { numbers, clearNumbers, listModified, resetListModified } = useContext(NumbersContext);
    const [cacheSize, setCacheSize] = useState(3);
    const [results, setLocalResults] = useState([]);
    const [activeAlgorithm, setActiveAlgorithm] = useState('');

    useEffect(() => {
        if (numbers.length === 0) {
            setLocalResults([]); // Clear local results when numbers is cleared
        }
    }, [numbers]);

    useEffect(() => {
        // Reset activeAlgorithm when the list is modified
        if (listModified) {
            setActiveAlgorithm('');
        }
    }, [listModified]);

    const handleCacheSizeChange = (event) => {
        setCacheSize(Number(event.target.value));
    };

    const getButtonClass = (algorithmName) => {
        return algorithmName === activeAlgorithm ? classes.inactiveButton : '';
    };

    const runAlgorithm = (algorithm) => {
        const pageNumbers = numbers.map(item => parseInt(item.primary));
        let algoResults;

        switch (algorithm) {
            case 'FIFO':
                algoResults = fifoPageReplacement(pageNumbers, cacheSize);
                break;
            case 'LRU':
                algoResults = lruPageReplacement(pageNumbers, cacheSize);
                break;
            case 'MRU':
                algoResults = mruPageReplacement(pageNumbers, cacheSize);
                break;
            case 'MFU':
                algoResults = mfuPageReplacement(pageNumbers, cacheSize);
                break;
            case 'LFU':
                algoResults = lfuPageReplacement(pageNumbers, cacheSize);
                break;
            case 'MIN':
                algoResults = minPageReplacement(pageNumbers, cacheSize);
                break;
            default:
                algoResults = { results: [] };
        }

        setActiveAlgorithm(algorithm);
        resetListModified();
        setLocalResults(algoResults.results); // Update local state for the table
        setResults(algoResults.results); // Update App.js state if needed
    };

    return (
        <div>
            <Grid container spacing={1} className={classes.actionArea} alignItems="center">
                <Grid item xs={12} sm={3}>
                    <TextField
                        label="Cache Size"
                        type="number"
                        value={cacheSize}
                        onChange={handleCacheSizeChange}
                        size='small'
                        variant="outlined"
                        className={classes.numberInput}
                    />
                </Grid>
                {/* Algorithm Buttons Grid */}
                <Grid item container xs={12} sm={9} spacing={1}>
                    <Grid item xs={6} sm={4} md={2}>
                        <Button onClick={() => runAlgorithm('FIFO')} color="primary" variant="contained" className={`${classes.button} ${getButtonClass('FIFO')}`}>
                            FIFO
                        </Button>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Button onClick={() => runAlgorithm('LRU')} color="primary" variant="contained" className={`${classes.button} ${getButtonClass('LRU')}`}>
                            LRU
                        </Button>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Button onClick={() => runAlgorithm('MRU')} color="primary" variant="contained" className={`${classes.button} ${getButtonClass('MRU')}`}>
                            MRU
                        </Button>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Button onClick={() => runAlgorithm('MIN')} color="primary" variant="contained" className={`${classes.button} ${getButtonClass('MIN')}`}>
                            MIN
                        </Button>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Button onClick={() => runAlgorithm('MFU')} color="primary" variant="contained" className={`${classes.button} ${getButtonClass('MFU')}`}>
                            MFU
                        </Button>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Button onClick={() => runAlgorithm('LFU')} color="primary" variant="contained" className={`${classes.button} ${getButtonClass('LFU')}`}>
                            LFU
                        </Button>
                    </Grid>
                </Grid>
                {/* Clear Button Grid */}
                <Grid item xs={12} sm={2}>
                    <Button onClick={clearNumbers} variant="contained" className={classes.button}>
                        Clear
                    </Button>
                </Grid>
            </Grid>
            <Table className={classes.table}>
                <TableHead>
                    <TableRow className={classes.tableRow}>
                        <TableCell className={classes.tableCell}>Page Number</TableCell>
                        <TableCell className={classes.tableCell}>Cache</TableCell>
                        <TableCell className={classes.tableCell}>Hit/Miss</TableCell>
                        <TableCell className={classes.tableCell}>Type</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {results.map((result, index) => (
                        <TableRow key={index} className={classes.tableRow}>
                            <TableCell className={classes.tableCell}>{result.page}</TableCell>
                            <TableCell className={classes.tableCell}>{result.cache.join(', ')}</TableCell>
                            <TableCell className={classes.tableCell}>{result.hitOrMiss}</TableCell>
                            <TableCell className={classes.tableCell}>{result.compulsoryOrCapacity}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default PageReplacement;
