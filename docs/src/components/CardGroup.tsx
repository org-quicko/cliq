import React from 'react';
import {ArrowUpRight } from 'lucide-react';
import styles from './CardGroup.module.css';

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  href: string;
  arrow?: boolean;
  horizontal?: boolean;
  children?: React.ReactNode;
}

interface CardGroupProps {
  cols?: number;
  children: React.ReactNode;
}

export function Card({ title, icon, href, arrow = false, horizontal = false, children }: CardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.card} ${horizontal ? styles.horizontal : ''}`}
    >
      <div className={styles.cardContent}>
        {icon && <span className={styles.cardIcon}>{icon}</span>}
        <span className={styles.cardTitle}>{title}</span>
        {children && <span className={styles.cardBody}>{children}</span>}
      </div>
      {arrow && <span className={styles.cardArrow}><ArrowUpRight size={20} /></span>}
    </a>
  );
}

export function CardGroup({ cols = 2, children }: CardGroupProps) {
  return (
    <div
      className={styles.cardGroup}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {children}
    </div>
  );
}
