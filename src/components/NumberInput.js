import React, { useState, useContext } from 'react';
import { TextField, Button, makeStyles } from '@material-ui/core';
import { NumbersContext } from '../NumbersContext';

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%', // Ensure it takes the full width of its parent
        padding: theme.spacing(1), // Add some padding for visual appeal
    },
    inputField: {
        flexGrow: 9, // This will take up 90% of the space
        marginRight: theme.spacing(1), // Add some margin for spacing between elements
    },
    addButton: {
        flexGrow: 1, // This will take up 10% of the space
        border: '1px dotted #19473d'
    }
}));

const NumberInput = () => {
    const classes = useStyles();
    const [inputValue, setInputValue] = useState('');
    const { addNumbers } = useContext(NumbersContext);

    const handleSubmit = () => {
        const newNumbers = inputValue.split(',')
            .map(num => num.trim())
            .filter(num => !isNaN(num) && num !== '')
            .map(num => parseFloat(num));

        if (newNumbers.length > 0) {
            addNumbers(newNumbers);
            setInputValue('');
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
          handleSubmit();
        }
      };

    return (
        <div className={classes.root}>
            <TextField
                className={classes.inputField}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter numbers (separated by commas)" />
            <Button className={classes.addButton} onClick={handleSubmit}>
                Append To Reference Stream
            </Button>
        </div>
    );
};

export default NumberInput;