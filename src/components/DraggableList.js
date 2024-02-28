import React, { useState, useContext } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  ListItemSecondaryAction
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { NumbersContext } from '../NumbersContext';
import EditIcon from '@material-ui/icons/Edit';
import DoneIcon from '@material-ui/icons/Done';
import DeleteIcon from '@material-ui/icons/Delete';

const useStyles = makeStyles({
  list: {
    minHeight: '200px', // Adjust as needed
    border: '1px solid #19473d',
    padding: '10px',
  },
  listItem: {
    border: '1px solid #19473d', // Add border to each list item
    marginBottom: '5px', // Optional: add space between items
    borderRadius: '4px', // Optional: round corners
  },
});

const DraggableList = () => {
  const classes = useStyles();
  const { numbers, setNumbers, markListAsModified } = useContext(NumbersContext);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    const newNumbers = reorder(
      numbers,
      result.source.index,
      result.destination.index
    );
    setNumbers(newNumbers);
    markListAsModified();
  };

  const startEditing = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = (id) => {
    if (editText.trim() !== '') {
        let isModified = false; // Flag to track if the list was actually modified

        const updatedNumbers = numbers.map(item => {
            if (item.id === id) {
                // Check if the edited value is different from the original value
                if (item.primary !== editText.trim()) {
                    isModified = true; // Mark as modified only if the value has changed
                    return { ...item, primary: editText.trim() };
                }
            }
            return item;
        });

        if (isModified) {
            markListAsModified(); // Only mark as modified if there's an actual change
        }

        setNumbers(updatedNumbers);
    }
    setEditingId(null);
    setEditText('');
};

  const deleteItem = (id) => {
    const updatedNumbers = numbers.filter(item => item.id !== id);
    markListAsModified();
    setNumbers(updatedNumbers);
  };

  const handleKeyPress = (event, id) => {
    if (event.key === 'Enter') {
      saveEdit(id);
    }
  };

  const handleChange = (event) => {
    const value = event.target.value;
    // Allow only numeric input
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setEditText(value);
    }
  };

  // Styles for draggable items (adjust as needed)
  const getItemStyle = (isDragging, draggableStyle) => ({
    // ... your draggable styles here ...
    ...(isDragging && {
      background: "rgb(235,235,235)"
    }),
    ...draggableStyle,
  });

  const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <List className={classes.list} style={getListStyle(snapshot.isDraggingOver)} ref={provided.innerRef} {...provided.droppableProps}>
            {numbers.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <ListItem
                    className={classes.listItem}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                  >
                    {editingId === item.id ? (
                      <TextField
                        value={editText}
                        onChange={handleChange}
                        onKeyPress={(event) => handleKeyPress(event, item.id)}
                        fullWidth
                      />
                    ) : (
                      <ListItemText
                        primary={item.primary}
                        // Optionally, use 'secondary' property if it exists
                        secondary={item.secondary}
                      />
                    )}
                    <ListItemSecondaryAction>
                      {editingId === item.id ? (
                        <IconButton onClick={() => saveEdit(item.id)}>
                          <DoneIcon />
                        </IconButton>
                      ) : (
                        <>
                          <IconButton onClick={() => startEditing(item.id, item.primary)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => deleteItem(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableList;