import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Fade } from '@mui/material';
import { Info, Landmark, Globe2, Wallet, CheckCircle2, Circle, Copy, Check } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { SegmentedControl } from '../../common/SegmentedControl';
import type { PublicConfig } from '../../../types';

interface PaymentOptionsProps {
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  getTransferAmount: () => string;
  handleSelectAccount: (text: string, id: string) => void;
  selectedAccountId: string | null;
  publicConfig: PublicConfig;
}

export const PaymentOptions: React.FC<PaymentOptionsProps> = ({ selectedBank, setSelectedBank, getTransferAmount, handleSelectAccount, selectedAccountId, publicConfig }) => {
  const theme = useTheme();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const onCopy = (text: string, id: string) => {
    handleSelectAccount(text, id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 1.5 }}>
          Pembayaran
        </Typography>
        <Box sx={{ textAlign: 'right', p: 1.5, bgcolor: 'rgba(19, 56, 39, 0.04)', borderRadius: 2, border: '1px solid', borderColor: 'primary.light' }}>
           <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 0.25, fontSize: '0.6rem' }}>
             Nominal Transfer
           </Typography>
           <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 900, lineHeight: 1 }}>
             {getTransferAmount()}
           </Typography>
        </Box>
      </Box>
      
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 1, mb: 4, borderRadius: 3 }}>
        <SegmentedControl 
          options={[
            {id: 'jp', label: 'Bank Jepang', icon: <Landmark size={14} />}, 
            {id: 'id', label: 'Bank Indonesia', icon: <Globe2 size={14} />},
            {id: 'cash', label: 'Tunai', icon: <Wallet size={14} />}
          ]}
          active={selectedBank}
          onChange={setSelectedBank}
        />
        
        <Box sx={{ mt: 1 }}>
          {(selectedBank === 'jp' ? publicConfig.banks.JP : selectedBank === 'id' ? publicConfig.banks.ID : []).map((bank) => {
            const isActive = selectedAccountId === bank.id;
            const isCopied = copiedId === bank.id;

            return (
              <Box 
                key={bank.id} 
                onClick={() => onCopy(bank.account, bank.id)}
                sx={{ 
                  p: 2.5, 
                  mb: 1.5,
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  bgcolor: isActive ? 'rgba(18, 76, 58, 0.05)' : 'background.default',
                  border: '2px solid',
                  borderColor: isActive ? 'primary.main' : 'divider',
                  borderRadius: 3,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: isActive ? 'primary.main' : 'primary.light',
                    bgcolor: isActive ? 'rgba(18, 76, 58, 0.08)' : 'background.paper',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 0.5, fontSize: '0.65rem' }}>
                    {bank.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isActive ? 'primary.main' : 'text.primary', letterSpacing: 0.5 }}>
                      {bank.account}
                    </Typography>
                    <Box sx={{ color: isCopied ? 'success.main' : 'text.disabled', display: 'flex' }}>
                       {isCopied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', whiteSpace: 'pre-line', lineHeight: 1.3, display: 'block' }}>
                    {bank.name}
                  </Typography>
                </Box>
                
                <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                   <Fade in={isCopied}>
                     <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.6rem', position: 'absolute', top: 12, right: 16 }}>
                       Copied!
                     </Typography>
                   </Fade>
                   <Button 
                    size="small"
                    variant={isActive ? 'contained' : 'outlined'}
                    onClick={(e) => { e.stopPropagation(); onCopy(bank.account, bank.id); }} 
                    sx={{ 
                      minWidth: 80, px: 2, py: 0.75, borderRadius: 1.5, borderWidth: 1.5, 
                      borderColor: 'primary.main', fontWeight: 900, fontSize: '0.7rem',
                      textTransform: 'uppercase', boxShadow: isActive ? '0 4px 12px rgba(18, 76, 58, 0.2)' : 0
                    }}
                    color="primary"
                  >
                    {isActive ? 'Terpilih' : 'Pilih'}
                  </Button>
                </Box>
              </Box>
            );
          })}

          {selectedBank === 'cash' && (
            <Box sx={{ p: 3, pt: 4, textAlign: 'center' }}>
              <Box sx={{ bgcolor: 'rgba(245, 166, 35, 0.1)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
                <Wallet size={32} color={theme.palette.secondary.main} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                Pembayaran Tunai
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, px: 2, lineHeight: 1.6, fontWeight: 500 }}>
                {publicConfig.cashPaymentText.replace('{masjidName}', publicConfig.masjidName)}
              </Typography>
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.primary', fontWeight: 700, lineHeight: 1.5 }}>
                  <Info size={14} style={{ verticalAlign: 'middle', marginRight: 6, color: theme.palette.primary.main }} />
                  Mohon lampirkan foto tanda terima atau foto dengan panitia saat serah terima tunai pada bagian Upload Bukti di bawah.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
