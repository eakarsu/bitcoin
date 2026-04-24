import { useState, createContext, useContext, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Box
} from '@mui/material';
import { Warning, Delete, Info, CheckCircle } from '@mui/icons-material';

const ConfirmContext = createContext(null);

const iconMap = {
  warning: <Warning sx={{ fontSize: 48, color: 'warning.main' }} />,
  danger: <Delete sx={{ fontSize: 48, color: 'error.main' }} />,
  info: <Info sx={{ fontSize: 48, color: 'info.main' }} />,
  success: <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />,
};

const colorMap = {
  warning: 'warning',
  danger: 'error',
  info: 'primary',
  success: 'success',
};

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
  });

  const confirm = useCallback(({ title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => {
          setDialog(prev => ({ ...prev, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialog(prev => ({ ...prev, open: false }));
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={dialog.open}
        onClose={dialog.onCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ mb: 1 }}>{iconMap[dialog.type]}</Box>
          {dialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: 'center' }}>
            {dialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          <Button onClick={dialog.onCancel} variant="outlined" color="inherit">
            {dialog.cancelText}
          </Button>
          <Button
            onClick={dialog.onConfirm}
            variant="contained"
            color={colorMap[dialog.type]}
            autoFocus
          >
            {dialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};

export default ConfirmContext;
