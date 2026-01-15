'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SpeedDial.module.css';

interface Action {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface SpeedDialProps {
  actions: Action[];
}

export function SpeedDial({ actions }: SpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className={styles.container}>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        className={styles.mainButton}
        onClick={toggleOpen}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
        aria-label={isOpen ? "閉じる" : "追加"}
      >
        +
      </motion.button>

      {/* Actions */}
      <AnimatePresence>
        {isOpen && (
          <div className={styles.actions}>
            {actions.map((action, index) => (
              <motion.div
                key={index}
                className={styles.actionItem}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
              >
                <div className={styles.label}>{action.label}</div>
                <button className={styles.miniButton}>
                  {action.icon}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
