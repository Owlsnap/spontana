import React from 'react';
import { Skeleton, SkeletonText, SkeletonButton, SkeletonCircle } from './Skeleton';
import './Skeleton.css';

export const EventpageSkeleton = () => {
  return (
    <div className="eventpage-skeleton">
      {/* Hero Skeleton */}
      <div className="eventpage-hero-skeleton">
        <div className="eventpage-hero-skeleton-content">
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <Skeleton width="80px" height="28px" />
            <Skeleton width="100px" height="28px" />
          </div>
          <Skeleton width="60%" height="48px" />
          <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
            <Skeleton width="200px" height="32px" />
            <Skeleton width="150px" height="32px" />
            <Skeleton width="180px" height="32px" />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="eventpage-skeleton-grid">
        {/* Main Column */}
        <div className="eventpage-skeleton-main">
          {/* Description Section */}
          <div className="eventpage-skeleton-section">
            <Skeleton width="150px" height="28px" style={{ marginBottom: 'var(--space-lg)' }} />
            <SkeletonText lines={4} />
          </div>

          {/* Location Section */}
          <div className="eventpage-skeleton-section">
            <Skeleton width="120px" height="28px" style={{ marginBottom: 'var(--space-lg)' }} />
            <Skeleton width="70%" height="32px" style={{ marginBottom: 'var(--space-md)' }} />
            <SkeletonText lines={3} />
            <SkeletonButton width="150px" style={{ marginTop: 'var(--space-md)' }} />
          </div>

          {/* Organizer Section */}
          <div className="eventpage-skeleton-section">
            <Skeleton width="140px" height="28px" style={{ marginBottom: 'var(--space-lg)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
              <SkeletonCircle size="80px" />
              <div style={{ flex: 1 }}>
                <Skeleton width="150px" height="24px" style={{ marginBottom: 'var(--space-sm)' }} />
                <Skeleton width="200px" height="16px" style={{ marginBottom: 'var(--space-sm)' }} />
                <Skeleton width="180px" height="16px" />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="eventpage-skeleton-section">
            <Skeleton width="100px" height="28px" style={{ marginBottom: 'var(--space-lg)' }} />
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <Skeleton width="100px" height="32px" />
              <Skeleton width="120px" height="32px" />
              <Skeleton width="90px" height="32px" />
              <Skeleton width="110px" height="32px" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="eventpage-skeleton-sidebar">
          {/* Action Card */}
          <div className="eventpage-skeleton-action-card">
            {/* Price */}
            <div style={{ textAlign: 'center', paddingBottom: 'var(--space-xl)', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
              <Skeleton width="150px" height="56px" style={{ margin: '0 auto' }} />
            </div>

            {/* Capacity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <Skeleton width="120px" height="16px" />
                <Skeleton width="80px" height="24px" />
              </div>
              <Skeleton width="100%" height="8px" borderRadius="4px" />
            </div>

            {/* CTA Button */}
            <Skeleton
              width="100%"
              height="56px"
              variant="button"
              className="angular-large"
            />

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <SkeletonButton width="100%" />
              <SkeletonButton width="100%" />
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="eventpage-skeleton-section">
            <Skeleton width="100px" height="20px" style={{ marginBottom: 'var(--space-lg)' }} />
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <Skeleton width="60px" height="16px" />
                <Skeleton width="100px" height="16px" />
              </div>
            ))}
          </div>

          {/* Social Proof Card */}
          <div className="eventpage-skeleton-section">
            <Skeleton width="120px" height="20px" style={{ marginBottom: 'var(--space-lg)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <Skeleton width="40px" height="28px" style={{ margin: '0 auto var(--space-xs)' }} />
                  <Skeleton width="50px" height="12px" style={{ margin: '0 auto' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Events Skeleton */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <Skeleton width="300px" height="32px" style={{ marginBottom: 'var(--space-2xl)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="eventpage-skeleton-section">
              <Skeleton width="100%" height="200px" borderRadius="0" style={{ marginBottom: 'var(--space-lg)' }} />
              <Skeleton width="80%" height="24px" style={{ marginBottom: 'var(--space-sm)' }} />
              <Skeleton width="60%" height="16px" style={{ marginBottom: 'var(--space-md)' }} />
              <Skeleton width="100px" height="24px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventpageSkeleton;
