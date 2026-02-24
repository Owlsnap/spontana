import React from 'react';
import { Skeleton, SkeletonText } from './Skeleton';
import './Skeleton.css';

export const EventCardSkeleton = ({ count = 5 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="event-card-skeleton">
          <div className="event-card-skeleton-content">
            {/* Meta info (date, location, tags) */}
            <div className="event-card-skeleton-meta">
              <Skeleton width="100px" height="20px" />
              <Skeleton width="120px" height="20px" />
              <Skeleton width="80px" height="20px" />
            </div>

            {/* Event title */}
            <Skeleton width="80%" height="32px" />

            {/* Description */}
            <SkeletonText lines={2} />

            {/* Event details (time, price, spots) */}
            <div className="event-card-skeleton-meta">
              <Skeleton width="60px" height="20px" />
              <Skeleton width="80px" height="20px" />
              <Skeleton width="100px" height="20px" />
            </div>
          </div>

          {/* Event image */}
          <div className="event-card-skeleton-image" />
        </div>
      ))}
    </>
  );
};

export default EventCardSkeleton;
