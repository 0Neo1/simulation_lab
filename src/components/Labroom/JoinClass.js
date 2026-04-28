import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useRecoilState } from 'recoil';
import { db } from '../../configs/firebase';
import { joinDialogAtom } from '../../utils/atoms';

function JoinClass() {
  const [open, setOpen] = useRecoilState(joinDialogAtom);
  const [classId, setClassId] = useState('');
  const { auth } = useSelector((state) => state);

  const handleClose = () => {
    setOpen(false);
  };

  const joinClass = async () => {
    if (classId === undefined || classId === '') {
      toast.error(`Provide a Lab Room code`);
      return;
    }

    try {
      // check if class exists
      const classRef = await db.collection('classes').doc(classId).get();

      if (classRef.exists) {
        // user is enrolled
        const classData = await classRef.data();

        // add to current user's class list
        const userRef = await db
          .collection('users')
          .where('email', '==', auth.user.email)
          .get();

        const userData = await userRef.docs[0].data();

        let tempClassrooms = userData.enrolledClassrooms;
        tempClassrooms.push({
          creatorEmail: classData.creatorEmail,
          creatorName: classData.creatorName,
          creatorPhoto: classData.creatorPhoto,
          id: classId,
          name: classData.name,
        });
        await userRef.docs[0].ref.update({
          enrolledClassrooms: tempClassrooms,
        });
        // alert done
        toast.success(
          `Successfully enrolled in ${classData.name} Lab Room`
        );

        setClassId('');
        handleClose();
      } else {
        toast.error(`Lab Room not found, please provide a valid code`);
        setClassId('');
        handleClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  return (
    <div className="joinClass">
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Join Lab Room</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the joining code to join the Lab Room
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Lab Room Code"
            type="text"
            fullWidth
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={joinClass} color="primary">
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default JoinClass;
