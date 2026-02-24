import React from 'react';
import './Skeleton.css';

export const Skeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  variant = 'default',
  className = ''
}) => {
  return (
    <div
      className={`skeleton ${variant} ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
    />
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`skeleton-text ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCircle = ({ size = '40px', className = '' }) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
      className={className}
    />
  );
};

export const SkeletonButton = ({ width = '120px', className = '' }) => {
  return (
    <Skeleton
      width={width}
      height="40px"
      borderRadius="0"
      variant="button"
      className={className}
    />
  );
};
