import React, { FC } from 'react';
import styles from './LoginButtons.module.scss';
import cn from 'classnames';
import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

export interface LogInButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  label: string;
  onLogin?: () => void;
  disabled?: boolean;
}
export const LogInButton: FC<LogInButtonProps> = (props: LogInButtonProps) => {
  const { label, onLogin, disabled, ...otherProps } = props;
  return (
    <button
      className={cn(styles.buttonLogin)}
      onClick={onLogin}
      disabled={disabled}
      {...otherProps}
    >
      {label}
    </button>
  );
};
