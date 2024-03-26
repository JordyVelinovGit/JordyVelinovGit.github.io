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
        let evicted = null;

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
            hits++;
        } else {
            hitOrMiss = 'Miss';
            misses++;
            compulsoryOrCapacity = (cache.length < cacheSize) ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                evicted = cache.shift();
            }

            cache.push(page);
        }

        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache],
            evicted: evicted
        });
    }

    return { results, hits, misses };
}

function mruPageReplacement(pages, cacheSize) {
    let cache = [];
    let results = [];
    let cachePositions = new Map();
    let lastUsedIndexMap = new Map();

    pages.forEach((page, index) => {
        let hitOrMiss = '';
        let compulsoryOrCapacity = '';
        let evicted = null;

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
            cachePositions.set(page, index);
            lastUsedIndexMap.set(page, index);
        } else {
            hitOrMiss = 'Miss';
            compulsoryOrCapacity = (cache.length < cacheSize) ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                let mruPage = [...cache].reduce((a, b) => lastUsedIndexMap.get(a) > lastUsedIndexMap.get(b) ? a : b);
                evicted = mruPage;
                cache.splice(cache.indexOf(mruPage), 1);
                lastUsedIndexMap.delete(mruPage);
            }
            cache.push(page);
            lastUsedIndexMap.set(page, index);
        }

        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache],
            evicted: evicted
        });
    });

    return { results };
}

function lruPageReplacement(pages, cacheSize) {
    let cache = [];
    let results = [];
    let lastUsedIndexMap = new Map();

    pages.forEach((page, index) => {
        let hitOrMiss = '';
        let compulsoryOrCapacity = '';
        let evicted = null;
        let evictedIndex = -1;

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
            lastUsedIndexMap.set(page, index);
        } else {
            hitOrMiss = 'Miss';
            compulsoryOrCapacity = cache.length < cacheSize ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                const lruPage = [...lastUsedIndexMap.entries()].reduce((a, b) => a[1] < b[1] ? a : b)[0];
                evicted = lruPage;
                evictedIndex = cache.findIndex((p) => p === lruPage);
                cache[evictedIndex] = page;
                lastUsedIndexMap.delete(lruPage);
            } else {
                cache.push(page);
            }
            lastUsedIndexMap.set(page, index);
        }

        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache],
            evicted: evicted
        });
    });

    return { results };
}

function mfuPageReplacement(pages, cacheSize) {
    let cache = [];
    let results = [];
    let usageCounts = new Map();

    pages.forEach((page) => {
        let hitOrMiss = '';
        let compulsoryOrCapacity = '';
        let evicted = null;

        usageCounts.set(page, (usageCounts.get(page) || 0) + 1);

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
        } else {
            hitOrMiss = 'Miss';
            compulsoryOrCapacity = cache.length < cacheSize ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                const mfuPage = [...cache].reduce((a, b) => usageCounts.get(a) > usageCounts.get(b) ? a : b);
                evicted = mfuPage;
                cache = cache.filter(p => p !== mfuPage);
            }

            cache.push(page);
        }

        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache],
            evicted: evicted
        });
    });

    return { results };
}

function lfuPageReplacement(pages, cacheSize) {
    let cache = [];
    let accessFrequency = new Map();
    let lastAccessed = new Map();
    let results = [];
    let time = 0;

    pages.forEach((page) => {
        let hitOrMiss = "Miss";
        let compulsoryOrCapacity = "Compulsory";
        let evicted = null;
        let evictedIndex = -1;

        // Update or initialize frequency count
        accessFrequency.set(page, (accessFrequency.get(page) || 0) + 1);
        lastAccessed.set(page, time++);

        if (cache.includes(page)) {
            hitOrMiss = "Hit";
            compulsoryOrCapacity = "";
        } else {
            if (cache.length >= cacheSize) {
                compulsoryOrCapacity = "Capacity";
                let lfuPage = [...cache].reduce((lfu, currPage) => {
                    const freqCompare = accessFrequency.get(currPage) - accessFrequency.get(lfu);
                    if (freqCompare < 0 || (freqCompare === 0 && lastAccessed.get(currPage) < lastAccessed.get(lfu))) {
                        return currPage;
                    }
                    return lfu;
                }, cache[0]);

                evicted = lfuPage;
                evictedIndex = cache.findIndex((p) => p === lfuPage);
                cache[evictedIndex] = page;
            } else {
                cache.push(page);
            }
        }

        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache],
            evicted: evicted
        });
    });

    return { results };
}

function minPageReplacement(pages, cacheSize) {
    let cache = [];
    let futureUses = {};
    let results = [];

    pages.forEach((page, index) => {
        if (!futureUses.hasOwnProperty(page)) futureUses[page] = [];
        futureUses[page].push(index);
    });

    pages.forEach((page) => {
        let hitOrMiss = '';
        let compulsoryOrCapacity = '';
        let evicted = null;

        futureUses[page].shift();

        if (cache.includes(page)) {
            hitOrMiss = 'Hit';
        } else {
            hitOrMiss = 'Miss';
            compulsoryOrCapacity = cache.length < cacheSize ? 'Compulsory' : 'Capacity';

            if (cache.length >= cacheSize) {
                const pageToReplace = cache.reduce((furthestPage, current) => {
                    const currentNextUse = futureUses[current].length > 0 ? futureUses[current][0] : Number.MAX_SAFE_INTEGER;
                    const furthestNextUse = futureUses[furthestPage].length > 0 ? futureUses[furthestPage][0] : Number.MAX_SAFE_INTEGER;
                    return currentNextUse > furthestNextUse ? current : furthestPage;
                });
                evicted = pageToReplace;
                cache = cache.filter(p => p !== pageToReplace);
            }

            cache.push(page);
        }

        results.push({
            page,
            hitOrMiss,
            compulsoryOrCapacity,
            cache: [...cache],
            evicted: evicted
        });
    });

    return { results };
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
            clearNumbers();
            resetListModified();
            setActiveAlgorithm('');
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
                        <TableCell className={classes.tableCell}>Eviction</TableCell> {/* New Column Header */}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {results.map((result, index) => (
                        <TableRow key={index} className={classes.tableRow}>
                            <TableCell className={classes.tableCell}>{result.page}</TableCell>
                            <TableCell className={classes.tableCell}>{result.cache.join(', ')}</TableCell>
                            <TableCell className={classes.tableCell}>{result.hitOrMiss}</TableCell>
                            <TableCell className={classes.tableCell}>{result.compulsoryOrCapacity}</TableCell>
                            <TableCell className={classes.tableCell}>{result.evicted || '—'}</TableCell> {/* New Column Data */}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default PageReplacement;
