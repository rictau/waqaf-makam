import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Landmark, Globe2, Wallet, Copy, Check } from 'lucide-react';
import { SegmentedControl } from '../../common/SegmentedControl';
import { c, eyebrow, radius, tnum } from '../../../design';
import { Eyebrow, Figure, Mono } from '../../common/primitives';
import type { PublicConfig } from '../../../types';

interface PaymentOptionsProps {
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  getTransferAmount: () => string;
  handleSelectAccount: (text: string, id: string) => void;
  selectedAccountId: string | null;
  publicConfig: PublicConfig;
}

/**
 * Transfer instructions as a record sheet: the amount stated once, in full,
 * at the top; then destination accounts as selectable rows with the number in
 * a monospaced face so digits can be checked one by one.
 */
export const PaymentOptions: React.FC<PaymentOptionsProps> = ({ selectedBank, setSelectedBank, getTransferAmount, handleSelectAccount, selectedAccountId, publicConfig }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const onCopy = (text: string, id: string) => {
    handleSelectAccount(text, id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const accounts = selectedBank === 'jp' ? publicConfig.banks.JP : selectedBank === 'id' ? publicConfig.banks.ID : [];

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', pb: 1, mb: 1.5, borderBottom: `1px solid ${c.ruleStrong}` }}>
        <Eyebrow tone="ink">Pembayaran</Eyebrow>
        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: c.inkFaint }}>Langkah 3</Typography>
      </Box>

      {/* Amount to transfer — stated plainly, left aligned, in the display face */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
          px: 2,
          py: 1.75,
          bgcolor: c.forest,
          borderRadius: `${radius.lg} ${radius.lg} 0 0`,
        }}
      >
        <Box>
          <Eyebrow tone="inverse" sx={{ fontSize: '0.5625rem' }}>Nominal Transfer</Eyebrow>
          <Figure size="1.625rem" tone={c.paper} sx={{ display: 'block', mt: 0.5 }}>
            {getTransferAmount()}
          </Figure>
        </Box>
        <Typography sx={{ ...eyebrow, fontSize: '0.5rem', color: 'rgba(251,249,244,0.7)', textAlign: 'right', pb: 0.5 }}>
          Sesuai nominal
        </Typography>
      </Box>

      <Box sx={{ border: `1px solid ${c.ruleStrong}`, borderTop: 'none', borderRadius: `0 0 ${radius.lg} ${radius.lg}`, bgcolor: c.paper, overflow: 'hidden' }}>
        <Box sx={{ p: 1.25, borderBottom: `1px solid ${c.rule}` }}>
          <SegmentedControl
            ariaLabel="Metode pembayaran"
            options={[
              { id: 'jp', label: 'Bank Jepang', icon: <Landmark size={13} /> },
              { id: 'id', label: 'Bank Indonesia', icon: <Globe2 size={13} /> },
              { id: 'cash', label: 'Tunai', icon: <Wallet size={13} /> }
            ]}
            active={selectedBank}
            onChange={setSelectedBank}
          />
        </Box>

        {accounts.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, bgcolor: c.well, borderBottom: `1px solid ${c.ruleStrong}` }}>
            <Eyebrow sx={{ fontSize: '0.6875rem' }}>Rekening Tujuan</Eyebrow>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: c.inkFaint }}>
              Salin untuk kemudahan transfer
            </Typography>
          </Box>
        )}

        {accounts.map((bank, index) => {
          const isActive = selectedAccountId === bank.id;
          const isCopied = copiedId === bank.id;

          return (
            <Box
              key={bank.id}
              sx={{
                p: { xs: 2, sm: 2.25 },
                borderTop: index === 0 ? 'none' : `1px solid ${c.rule}`,
                bgcolor: isActive ? c.forestTint : 'transparent',
                transition: 'background-color 150ms ease',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 1 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: c.ink }}>
                  {bank.label}
                </Typography>
                {isActive && (
                  <Box sx={{ px: 1, py: 0.25, bgcolor: c.forest, color: c.paper, borderRadius: radius.sm, fontSize: '0.6875rem', fontWeight: 700 }}>
                    Dipilih
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', my: 1 }}>
                <Mono sx={{ fontSize: '1.25rem', fontWeight: 700, color: isActive ? c.forest : c.ink, letterSpacing: '0.04em' }}>
                  {bank.account}
                </Mono>

                <Box
                  component="button"
                  type="button"
                  onClick={() => onCopy(bank.account, bank.id)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 2,
                    py: 0.875,
                    minHeight: 38,
                    cursor: 'pointer',
                    borderRadius: radius.md,
                    border: `1.5px solid ${isCopied ? c.verified : c.forest}`,
                    bgcolor: isCopied ? c.verified : isActive ? c.forest : 'transparent',
                    color: isCopied ? '#ffffff' : isActive ? '#ffffff' : c.forest,
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    transition: 'all 150ms ease',
                    '&:hover': {
                      bgcolor: isCopied ? c.verified : c.forest,
                      color: '#ffffff',
                    },
                    '&:active': { transform: 'scale(0.98)' },
                  }}
                >
                  {isCopied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
                  <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Nomor'}</span>
                </Box>
              </Box>

              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: c.inkMuted, whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                {bank.name}
              </Typography>
            </Box>
          );
        })}

        {selectedBank === 'cash' && (
          <Box sx={{ px: 2, py: 2.5 }}>
            <Eyebrow tone="ink" sx={{ fontSize: '0.8125rem', mb: 1 }}>Pembayaran Tunai</Eyebrow>
            <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.6, color: c.ink }}>
              {publicConfig.cashPaymentText.replace('{masjidName}', publicConfig.masjidName)}
            </Typography>
            <Box sx={{ mt: 2, p: 1.75, bgcolor: c.well, borderLeft: `3px solid ${c.brassBright}`, borderRadius: radius.sm }}>
              <Typography sx={{ fontSize: '0.8125rem', lineHeight: 1.55, color: c.ink, fontWeight: 500 }}>
                Mohon lampirkan foto tanda terima atau foto bersama panitia saat serah terima tunai pada bagian
                {' '}<strong>Upload Bukti</strong> di bawah.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {selectedBank !== 'cash' && (
        <Typography sx={{ mt: 1, fontSize: '0.75rem', color: c.inkMuted }}>
          Silakan transfer ke salah satu nomor rekening di atas, lalu lampirkan bukti transfer di bawah.
        </Typography>
      )}
    </Box>
  );
};
