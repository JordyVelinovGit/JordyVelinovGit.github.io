import React, { useState, useContext, useEffect } from 'react';
import { NumbersContext } from '../NumbersContext';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Button } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    numberInput: {
        width: '50%'
    },
    button: {
        width: '75px'
    },
    clearButton: {
        width: '20%'
    },
    actionArea: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing(2),
    },
    table: {
        minHeight: '400px',
        border: '1px solid #ddd',
        backgroundColor: '#28EEFF',
        padding: theme.spacing(1),
    },
    pageNumberCell: {
        width: '20%',
    },
    cacheCell: {
        width: '30%',
    },
    tableCell: {
        border: '2px solid #4f43f0 ',
        borderBottom: '2px solid #4f43f0',
    },
    inactiveButton: {
        color: '#c0c0c0',
        '&:hover': {
            backgroundColor: '#f5f5f5',
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

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
            hits++;
        } else {
            hitOrMiss = 'Miss';
            misses++;

            compulsoryOrCapacity = (cache.length < cacheSize) ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                cache.shift();
            }

            cache.push(page);
        }

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
            cachePositions.set(page, index);
        } else {
            hitOrMiss = 'Miss';
            compulsoryOrCapacity = (cache.length < cacheSize) ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                let mru = [...cachePositions.entries()].reduce((mru, entry) => entry[1] > mru[1] ? entry : mru);
                cachePositions.delete(mru[0]);
                cache[cache.indexOf(mru[0])] = page;
            } else {
                cache.push(page);
            }

            cachePositions.set(page, index);
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
            cachePositions.set(page, index);
        } else {
            hitOrMiss = 'Miss';
            compulsoryOrCapacity = (cache.length < cacheSize) ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                let lru = [...cachePositions.entries()].reduce((lru, entry) => entry[1] < lru[1] ? entry : lru);
                cachePositions.delete(lru[0]);
                cache[cache.indexOf(lru[0])] = page;
            } else {
                cache.push(page);
            }

            cachePositions.set(page, pages.indexOf(page));
        }

        results.push({ page, hitOrMiss, compulsoryOrCapacity, cache: [...cache] });
    });

    return { results };
}

function mfuPageReplacement(pages, cacheSize) {
    let cache = [];
    let usageCounts = new Map();
    let results = [];
    let pageIndexes = new Map();

    pages.forEach((page, index) => {
        let hitOrMiss = "Miss";
        let compulsoryOrCapacity = "Compulsory";

        usageCounts.set(page, (usageCounts.get(page) || 0) + 1);
        pageIndexes.set(page, index);

        if (cache.includes(page)) {
            hitOrMiss = "Hit";
            compulsoryOrCapacity = "";
        } else {
            if (cache.length >= cacheSize) {
                compulsoryOrCapacity = "Capacity";
                let mfuPage = [...cache].sort((a, b) => {
                    const freqCompare = usageCounts.get(b) - usageCounts.get(a);
                    if (freqCompare === 0) {
                        return pageIndexes.get(a) - pageIndexes.get(b);
                    }
                    return freqCompare;
                })[0];

                cache.splice(cache.indexOf(mfuPage), 1);
            }

            cache.push(page);
        }

        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache]
        });
    });

    return { results };
}

function lfuPageReplacement(pages, cacheSize) {
    let cache = [];
    let accessFrequency = new Map(); // Frequency of each page's access
    let insertionOrder = new Map(); // Order of insertion to resolve ties
    let results = [];
    let order = 0; // To track the order of insertion

    pages.forEach(page => {
        let hitOrMiss = 'Miss';
        let compulsoryOrCapacity = 'Compulsory';
        let evicted = '';

        // Update or initialize the frequency and insertion order
        accessFrequency.set(page, (accessFrequency.get(page) || 0) + 1);
        if (!insertionOrder.has(page)) {
            insertionOrder.set(page, order++);
        }

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
            compulsoryOrCapacity = ''; // No capacity or compulsory miss on hit
        } else {
            if (cache.length >= cacheSize) {
                compulsoryOrCapacity = 'Capacity';

                // Find the least frequently used page; if a tie, use insertion order to decide
                let lfuPage = [...cache].sort((a, b) => {
                    const freqCompare = accessFrequency.get(a) - accessFrequency.get(b);
                    if (freqCompare === 0) { // If frequencies are the same, sort by insertion order
                        return insertionOrder.get(a) - insertionOrder.get(b);
                    }
                    return freqCompare;
                })[0];

                evicted = lfuPage; // Track the evicted page for reporting
                cache = cache.filter(page => page !== lfuPage); // Remove the LFU page from the cache
            }
            cache.push(page); // Add the new page to the cache
        }

        // Record the result for this iteration
        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache], // Clone to snapshot the current state
            evicted: evicted
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

    for (let i = pages.length - 1; i >= 0; i--) {
        if (!futureUses.hasOwnProperty(pages[i])) {
            futureUses[pages[i]] = [];
        }
        futureUses[pages[i]].unshift(i);
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
                let maxDistance = -1, pageToReplace = null;
                cache.forEach((p) => {
                    if (futureUses[p].length === 0 || futureUses[p][0] > maxDistance) {
                        pageToReplace = p;
                        maxDistance = futureUses[p][0] || Number.MAX_SAFE_INTEGER;
                    }
                });

                cache = cache.filter((p) => p !== pageToReplace);
            }

            cache.push(page);
        }

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
            setLocalResults([]);
        }
    }, [numbers]);

    useEffect(() => {
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
        setLocalResults(algoResults.results);
        setResults(algoResults.results);
    };

    const handleClear = () => {
        if (window.confirm("This will clear everything. Are you sure?")) {
            clearNumbers(); // Clear the data
            resetListModified(); // Also reset any flags that might affect the UI, like graying out buttons
            setActiveAlgorithm(''); // Reset active algorithm selection
        }
    };

    return (
        <div>
            <Grid container spacing={1} className={classes.actionArea} alignItems="center">
                <Grid item lg={3} sm={9}>
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
                <Grid item xs={12}>
                    <Button onClick={handleClear} variant="contained" className={classes.clearButton}>
                        Clear All
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
